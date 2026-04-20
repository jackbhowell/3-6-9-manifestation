import { getUncachableRevenueCatClient } from "./revenueCatClient";
import {
  getProductsFromPackage,
  detachProductsFromPackage,
  attachProductsToPackage,
} from "@replit/revenuecat-sdk";

const PROJECT_ID = "proja1e3bd7f";
const PACKAGE_ID = "pkge6032684d63";
const TEST_STORE_PRODUCT_ID = "prodda095fa80c";
const APP_STORE_PRODUCT_ID = "prod3b41ef3b63";
const PLAY_STORE_PRODUCT_ID = "prod889bcd4f67";

interface PackageProductItem {
  eligibility_criteria: string;
  product: { id: string };
}

function extractPackageItems(data: unknown): PackageProductItem[] {
  if (
    typeof data !== "object" ||
    data === null ||
    !("items" in data) ||
    !Array.isArray((data as Record<string, unknown>)["items"])
  ) {
    return [];
  }
  const items = (data as Record<string, unknown>)["items"] as unknown[];
  return items.filter(
    (item): item is PackageProductItem =>
      typeof item === "object" &&
      item !== null &&
      "product" in item &&
      typeof (item as Record<string, unknown>)["product"] === "object" &&
      (item as Record<string, unknown>)["product"] !== null &&
      "id" in ((item as Record<string, unknown>)["product"] as Record<string, unknown>)
  );
}

async function fixPackage() {
  const client = await getUncachableRevenueCatClient();

  const { data: existingProducts, error } = await getProductsFromPackage({
    client,
    path: { project_id: PROJECT_ID, package_id: PACKAGE_ID },
  });

  if (error) {
    console.log("Error getting products:", JSON.stringify(error));
    return;
  }

  console.log("Existing products in package:", JSON.stringify(existingProducts, null, 2));

  const items = extractPackageItems(existingProducts);
  if (items.length > 0) {
    console.log("Detaching existing products...");
    const { error: detachError } = await detachProductsFromPackage({
      client,
      path: { project_id: PROJECT_ID, package_id: PACKAGE_ID },
      body: { product_ids: items.map((item) => item.product.id) },
    });
    if (detachError) {
      console.log("Detach error:", JSON.stringify(detachError));
    } else {
      console.log("Detached existing products");
    }
  }

  const { error: attachError } = await attachProductsToPackage({
    client,
    path: { project_id: PROJECT_ID, package_id: PACKAGE_ID },
    body: {
      products: [
        { product_id: TEST_STORE_PRODUCT_ID, eligibility_criteria: "all" },
        { product_id: APP_STORE_PRODUCT_ID, eligibility_criteria: "all" },
        { product_id: PLAY_STORE_PRODUCT_ID, eligibility_criteria: "all" },
      ],
    },
  });

  if (attachError) {
    console.log("Attach error:", JSON.stringify(attachError));
  } else {
    console.log("Successfully attached our products to the package!");
  }
}

fixPackage().catch(console.error);
