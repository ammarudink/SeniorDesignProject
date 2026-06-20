import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

type ProductFilters = {
  search?: string;
  categories?: string[];
  onSale?: boolean;
  sort?: string;
  skip?: number;
  take?: number;
};

const buildWhere = ({ search, categories, onSale }: ProductFilters): Prisma.ProductWhereInput => ({
  OR: search
    ? [
        {
          Name: {
            contains: search,
          },
        },
        {
          Category: {
            contains: search,
          },
        },
        {
          Description: {
            contains: search,
          },
        },
      ]
    : undefined,
  Category:
    categories && categories.length > 0
      ? {
          in: categories,
        }
      : undefined,
  SalePrice: onSale
    ? {
        not: null,
      }
    : undefined,
});

const buildOrderBy = (sort?: string): Prisma.ProductOrderByWithRelationInput => {
  if (sort === "price-asc") {
    return { Price: "asc" };
  }

  if (sort === "price-desc") {
    return { Price: "desc" };
  }

  if (sort === "name-asc") {
    return { Name: "asc" };
  }

  return { ProductID: "desc" };
};

export class ProductRepository {
  findMany(filters: ProductFilters) {
    return prisma.product.findMany({
      where: buildWhere(filters),
      skip: filters.skip,
      take: filters.take,
      orderBy: buildOrderBy(filters.sort),
    });
  }

  count(filters: ProductFilters) {
    return prisma.product.count({
      where: buildWhere(filters),
    });
  }

  findById(productId: number) {
    return prisma.product.findUnique({
      where: { ProductID: productId },
    });
  }

  findCategories() {
    return prisma.product.findMany({
      distinct: ["Category"],
      select: { Category: true },
      orderBy: { Category: "asc" },
    });
  }

  findDashboard(limit: number) {
    return prisma.product.findMany({
      take: limit,
      orderBy: {
        ProductID: "desc",
      },
    });
  }

  findRelated(category: string, exclude?: number, limit = 4) {
    return prisma.product.findMany({
      where: {
        Category: category,
        ProductID: exclude
          ? {
              not: exclude,
            }
          : undefined,
      },
      take: limit,
      orderBy: {
        ProductID: "desc",
      },
    });
  }

  create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data });
  }

  update(productId: number, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({
      where: { ProductID: productId },
      data,
    });
  }

  delete(productId: number) {
    return prisma.product.delete({
      where: { ProductID: productId },
    });
  }
}
