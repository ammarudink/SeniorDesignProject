import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import request from "supertest";

const mockPrisma: any = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  product: {
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  cartItem: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  order: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  payment: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock("../src/config/prisma", () => ({
  prisma: mockPrisma,
}));

import { app } from "../src/app";

const customer = {
  UserID: 1,
  Name: "Test Customer",
  Email: "customer@example.com",
  Password: "password123",
  Address: "Test Address 1",
  Role: "Customer",
};

const admin = {
  ...customer,
  UserID: 2,
  Name: "Admin User",
  Email: "admin@example.com",
  Role: "Admin",
};

const product = {
  ProductID: 10,
  Name: "Gaming Mouse",
  Price: 49.99,
  SalePrice: null,
  Category: "Mouse",
  Images: "https://cdn.example.com/mouse.jpg",
  Description: "Fast gaming mouse",
  Stock: 5,
};

function tokenFor(user: typeof customer) {
  return jwt.sign(
    {
      sub: user.UserID,
      email: user.Email,
      role: user.Role,
      name: user.Name,
    },
    process.env.JWT_SECRET!,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.$transaction.mockImplementation((callback: (tx: typeof mockPrisma) => unknown) => callback(mockPrisma));
});

describe("API integration routes", () => {
  it("registers a user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue(customer);

    const response = await request(app).post("/api/v1/auth/register").send({
      Name: customer.Name,
      Email: customer.Email,
      Password: "password123",
      ConfirmPassword: "password123",
      Address: customer.Address,
      Role: "Customer",
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.Email).toBe(customer.Email);
  });

  it("logs in a user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(customer);
    mockPrisma.user.update.mockResolvedValue({ ...customer, Password: "hashed" });

    const response = await request(app).post("/api/v1/auth/login").send({
      Email: customer.Email,
      Password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.Role).toBe("Customer");
  });

  it("gets products", async () => {
    mockPrisma.product.findMany.mockResolvedValue([product]);
    mockPrisma.product.count.mockResolvedValue(1);

    const response = await request(app).get("/api/v1/products");

    expect(response.status).toBe(200);
    expect(response.body.data.products).toHaveLength(1);
    expect(response.body.data.products[0].Name).toBe(product.Name);
  });

  it("adds a product to the cart", async () => {
    mockPrisma.product.findUnique.mockResolvedValue(product);
    mockPrisma.cartItem.findFirst.mockResolvedValue(null);
    mockPrisma.cartItem.create.mockResolvedValue({
      CartID: 5,
      UserID: customer.UserID,
      ProductID: product.ProductID,
      Quantity: 2,
      Product: product,
    });

    const response = await request(app)
      .post("/api/v1/cart")
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ ProductID: product.ProductID, Quantity: 2 });

    expect(response.status).toBe(201);
    expect(response.body.data.Quantity).toBe(2);
  });

  it("prevents cart quantity from exceeding product stock", async () => {
    mockPrisma.product.findUnique.mockResolvedValue({ ...product, Stock: 1 });
    mockPrisma.cartItem.findFirst.mockResolvedValue(null);

    const response = await request(app)
      .post("/api/v1/cart")
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ ProductID: product.ProductID, Quantity: 2 });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain("available in stock");
    expect(mockPrisma.cartItem.create).not.toHaveBeenCalled();
  });

  it("places an order from the cart", async () => {
    mockPrisma.cartItem.findMany.mockResolvedValue([
      {
        CartID: 5,
        UserID: customer.UserID,
        ProductID: product.ProductID,
        Quantity: 2,
        Product: product,
      },
    ]);
    mockPrisma.product.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.order.create.mockResolvedValue({
      OrderID: 20,
      UserID: customer.UserID,
      TotalAmount: 99.98,
      Status: "Pending",
      OrderItems: [
        {
          OrderItemID: 30,
          ProductID: product.ProductID,
          Quantity: 2,
          Price: 49.99,
          Product: product,
        },
      ],
      Payments: [
        {
          PaymentID: 40,
          Amount: 99.98,
          PaymentMethod: "cash",
          PaymentStatus: "Completed",
        },
      ],
    });
    mockPrisma.cartItem.deleteMany.mockResolvedValue({ count: 1 });

    const response = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ useCart: true, paymentMethod: "cash" });

    expect(response.status).toBe(201);
    expect(response.body.data.OrderID).toBe(20);
    expect(mockPrisma.product.updateMany).toHaveBeenCalledWith({
      where: {
        ProductID: product.ProductID,
        Stock: {
          gte: 2,
        },
      },
      data: {
        Stock: {
          decrement: 2,
        },
      },
    });
    expect(mockPrisma.cartItem.deleteMany).toHaveBeenCalled();
  });

  it("allows an admin to update order status", async () => {
    const existingOrder = {
      OrderID: 20,
      UserID: customer.UserID,
      TotalAmount: 99.98,
      Status: "Pending",
      OrderItems: [],
      Payments: [],
    };

    mockPrisma.order.findUnique.mockResolvedValue(existingOrder);
    mockPrisma.order.update.mockResolvedValue({
      ...existingOrder,
      Status: "Accepted",
    });

    const response = await request(app)
      .patch("/api/v1/orders/20/status")
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({ Status: "Accepted" });

    expect(response.status).toBe(200);
    expect(response.body.data.Status).toBe("Accepted");
    expect(mockPrisma.order.update).toHaveBeenCalledWith({
      where: { OrderID: 20 },
      data: { Status: "Accepted" },
      include: expect.any(Object),
    });
  });

  it("prevents customers from updating order status", async () => {
    const response = await request(app)
      .patch("/api/v1/orders/20/status")
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ Status: "Accepted" });

    expect(response.status).toBe(403);
    expect(mockPrisma.order.update).not.toHaveBeenCalled();
  });

  it("allows an admin to update a product", async () => {
    mockPrisma.product.findUnique.mockResolvedValue(product);
    mockPrisma.product.update.mockResolvedValue({ ...product, Price: 39.99 });

    const response = await request(app)
      .patch(`/api/v1/products/${product.ProductID}`)
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({ Price: 39.99 });

    expect(response.status).toBe(200);
    expect(response.body.data.Price).toBe(39.99);
  });

  it("allows an admin to create a product", async () => {
    const createdProduct = {
      ...product,
      ProductID: 11,
      Name: "Gaming Keyboard",
      Category: "Keyboard",
      Images: "https://example.supabase.co/storage/v1/object/public/product-images/products/keyboard.jpg",
    };

    mockPrisma.product.create.mockResolvedValue(createdProduct);

    const response = await request(app)
      .post("/api/v1/products")
      .set("Authorization", `Bearer ${tokenFor(admin)}`)
      .send({
        Name: createdProduct.Name,
        Price: 89.99,
        Category: createdProduct.Category,
        Images: createdProduct.Images,
        Description: "Mechanical gaming keyboard",
        Stock: 12,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.Name).toBe(createdProduct.Name);
    expect(mockPrisma.product.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        Name: createdProduct.Name,
        Category: createdProduct.Category,
        Images: createdProduct.Images,
        Stock: 12,
      }),
    });
  });

  it("prevents unauthorized users from updating products", async () => {
    const response = await request(app)
      .patch(`/api/v1/products/${product.ProductID}`)
      .set("Authorization", `Bearer ${tokenFor(customer)}`)
      .send({ Price: 39.99 });

    expect(response.status).toBe(403);
    expect(mockPrisma.product.update).not.toHaveBeenCalled();
  });
});
