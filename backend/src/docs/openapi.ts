import swaggerJSDoc from "swagger-jsdoc";
import { env } from "../config/env";

export const openApiSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "SenioDesign REST API",
      version: "1.0.0",
      description:
        "Express + TypeScript + Prisma backend that replaces the legacy PHP/Flight backend.",
    },
    servers: [
      {
        url: env.API_PREFIX,
        description: "Versioned API base path",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        AuthRegisterInput: {
          type: "object",
          required: ["Name", "Email", "Password", "Address"],
          properties: {
            Name: { type: "string", example: "John Doe" },
            Email: { type: "string", example: "john@example.com" },
            Password: { type: "string", example: "secret123" },
            Address: { type: "string", example: "123 Main Street" },
            Role: { type: "string", enum: ["Admin", "Customer"], example: "Customer" },
            AdminPassword: { type: "string", example: "adminadmin" }
          }
        },
        AuthLoginInput: {
          type: "object",
          required: ["Email", "Password"],
          properties: {
            Email: { type: "string", example: "john@example.com" },
            Password: { type: "string", example: "secret123" }
          }
        },
        ProductInput: {
          type: "object",
          required: ["Name", "Price", "Category"],
          properties: {
            Name: { type: "string", example: "PlayStation 5" },
            Price: { type: "number", example: 999.99 },
            SalePrice: { type: "number", example: 899.99 },
            Category: { type: "string", example: "Console" },
            Images: { type: "string", example: "https://cdn.example.com/ps5.jpg" },
            Description: { type: "string", example: "Next-gen gaming console." }
          }
        },
        OrderInput: {
          type: "object",
          properties: {
            useCart: { type: "boolean", example: true },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ProductID: { type: "integer", example: 1 },
                  Quantity: { type: "integer", example: 2 }
                }
              }
            }
          }
        },
        PaymentInput: {
          type: "object",
          required: ["OrderID", "PaymentMethod"],
          properties: {
            OrderID: { type: "integer", example: 1 },
            PaymentMethod: {
              type: "string",
              enum: ["cash", "bank-transfer", "credit-card"],
              example: "credit-card"
            },
            CardNumber: { type: "string", example: "4111111111111111" },
            ExpiryDate: { type: "string", example: "12/28" },
            Cvc: { type: "string", example: "123" }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }],
    paths: {
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthRegisterInput" }
              }
            }
          },
          responses: {
            "201": { description: "User registered successfully" }
          }
        }
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Authenticate a user and return a JWT",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthLoginInput" }
              }
            }
          },
          responses: {
            "200": { description: "Login successful" }
          }
        }
      },
      "/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Get the current authenticated user",
          responses: {
            "200": { description: "Authenticated user profile" }
          }
        }
      },
      "/products": {
        get: {
          tags: ["Products"],
          summary: "List products with pagination and filters",
          responses: {
            "200": { description: "Product list" }
          }
        },
        post: {
          tags: ["Products"],
          summary: "Create a new product",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProductInput" }
              }
            }
          },
          responses: {
            "201": { description: "Product created" }
          }
        }
      },
      "/products/dashboard": {
        get: {
          tags: ["Products"],
          summary: "Get latest products for dashboard cards",
          responses: {
            "200": { description: "Dashboard products" }
          }
        }
      },
      "/products/categories": {
        get: {
          tags: ["Products"],
          summary: "List all product categories",
          responses: {
            "200": { description: "Category list" }
          }
        }
      },
      "/products/related": {
        get: {
          tags: ["Products"],
          summary: "Get related products by category",
          responses: {
            "200": { description: "Related products" }
          }
        }
      },
      "/products/{productId}": {
        get: {
          tags: ["Products"],
          summary: "Get a product by id",
          parameters: [
            { in: "path", name: "productId", required: true, schema: { type: "integer" } }
          ],
          responses: {
            "200": { description: "Product details" }
          }
        },
        patch: {
          tags: ["Products"],
          summary: "Update a product",
          parameters: [
            { in: "path", name: "productId", required: true, schema: { type: "integer" } }
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProductInput" }
              }
            }
          },
          responses: {
            "200": { description: "Product updated" }
          }
        },
        delete: {
          tags: ["Products"],
          summary: "Delete a product",
          parameters: [
            { in: "path", name: "productId", required: true, schema: { type: "integer" } }
          ],
          responses: {
            "204": { description: "Product deleted" }
          }
        }
      },
      "/users": {
        get: {
          tags: ["Users"],
          summary: "List all users",
          responses: {
            "200": { description: "User list" }
          }
        }
      },
      "/users/{userId}": {
        get: {
          tags: ["Users"],
          summary: "Get a user by id",
          parameters: [
            { in: "path", name: "userId", required: true, schema: { type: "integer" } }
          ],
          responses: {
            "200": { description: "User details" }
          }
        },
        patch: {
          tags: ["Users"],
          summary: "Update a user",
          parameters: [
            { in: "path", name: "userId", required: true, schema: { type: "integer" } }
          ],
          responses: {
            "200": { description: "User updated" }
          }
        },
        delete: {
          tags: ["Users"],
          summary: "Delete a user",
          parameters: [
            { in: "path", name: "userId", required: true, schema: { type: "integer" } }
          ],
          responses: {
            "204": { description: "User deleted" }
          }
        }
      },
      "/cart": {
        get: {
          tags: ["Cart"],
          summary: "Get the current user's cart",
          responses: {
            "200": { description: "Cart contents" }
          }
        },
        post: {
          tags: ["Cart"],
          summary: "Add an item to cart",
          responses: {
            "201": { description: "Cart item created" }
          }
        },
        delete: {
          tags: ["Cart"],
          summary: "Clear the current user's cart",
          responses: {
            "204": { description: "Cart cleared" }
          }
        }
      },
      "/cart/{cartId}": {
        patch: {
          tags: ["Cart"],
          summary: "Update a cart item quantity",
          parameters: [
            { in: "path", name: "cartId", required: true, schema: { type: "integer" } }
          ],
          responses: {
            "200": { description: "Cart item updated" }
          }
        },
        delete: {
          tags: ["Cart"],
          summary: "Remove an item from cart",
          parameters: [
            { in: "path", name: "cartId", required: true, schema: { type: "integer" } }
          ],
          responses: {
            "204": { description: "Cart item removed" }
          }
        }
      },
      "/wishlist": {
        get: {
          tags: ["Wishlist"],
          summary: "Get the current user's wishlist",
          responses: {
            "200": { description: "Wishlist contents" }
          }
        },
        post: {
          tags: ["Wishlist"],
          summary: "Add a product to wishlist",
          responses: {
            "201": { description: "Wishlist item added" }
          }
        }
      },
      "/wishlist/{productId}": {
        delete: {
          tags: ["Wishlist"],
          summary: "Remove a product from wishlist",
          parameters: [
            { in: "path", name: "productId", required: true, schema: { type: "integer" } }
          ],
          responses: {
            "204": { description: "Wishlist item removed" }
          }
        }
      },
      "/orders": {
        get: {
          tags: ["Orders"],
          summary: "List orders for the current user or all orders for admin",
          responses: {
            "200": { description: "Order list" }
          }
        },
        post: {
          tags: ["Orders"],
          summary: "Create an order from cart items or supplied items",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/OrderInput" }
              }
            }
          },
          responses: {
            "201": { description: "Order created" }
          }
        }
      },
      "/orders/{orderId}": {
        get: {
          tags: ["Orders"],
          summary: "Get order details",
          parameters: [
            { in: "path", name: "orderId", required: true, schema: { type: "integer" } }
          ],
          responses: {
            "200": { description: "Order details" }
          }
        }
      },
      "/orders/{orderId}/status": {
        patch: {
          tags: ["Orders"],
          summary: "Update order status",
          parameters: [
            { in: "path", name: "orderId", required: true, schema: { type: "integer" } }
          ],
          responses: {
            "200": { description: "Order status updated" }
          }
        }
      },
      "/payments": {
        get: {
          tags: ["Payments"],
          summary: "List payments",
          responses: {
            "200": { description: "Payment list" }
          }
        },
        post: {
          tags: ["Payments"],
          summary: "Simulate a payment for an order",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaymentInput" }
              }
            }
          },
          responses: {
            "201": { description: "Payment processed" }
          }
        }
      }
    }
  },
  apis: []
});
