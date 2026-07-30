import { createClass } from "../src/services/class-service";

async function main() {
  try {
    const result = await createClass({ schoolId: "12", name: "Class A" });
    console.log("Created:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error creating class:", err);
    if (err instanceof Error) {
      console.error(err.stack);
    }
    process.exitCode = 1;
  }
}

main();
