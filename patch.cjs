const fs = require("fs");

// Patch users.test.js
let usersCode = fs.readFileSync("tests/users.test.js", "utf8");
usersCode = usersCode.replace(
  /\.post\("\/api\/users"\)\n\s*\.send/g,
  '.post("/api/users")\n      .set("Authorization", `Bearer ${adminToken()}`)\n      .send',
);
fs.writeFileSync("tests/users.test.js", usersCode);

// Patch categories.test.js
let catCode = fs.readFileSync("tests/categories.test.js", "utf8");

// Insert import if not exists
if (!catCode.includes("import { Producer }")) {
  catCode = catCode.replace(
    'import { supabase } from "../src/db/supabase.js";',
    'import { supabase } from "../src/db/supabase.js";\nimport { Producer } from "../src/models/producer.model.js";',
  );
}

// Fix 409 test
catCode = catCode.replace(
  /it\("debe devolver 409 si hay productores asignados a la categoría", async \(\) => {([\s\S]*?)const res = await supertest\(app\)/,
  `it("debe devolver 409 si hay productores asignados a la categoría", async () => {
      supabase.from = () => ({
        select: function() { return this; },
        eq:     function() { return this; },
        single: async function() { return { data: { nombre: "frutas" }, error: null }; },
      });

      const originalCount = Producer.countDocuments;
      Producer.countDocuments = async () => 3;

      const res = await supertest(app)`,
);
catCode = catCode.replace(
  /expect\(res\.body\.error\)\.toContain\("No se puede eliminar"\);\n\s*\}\);/,
  `expect(res.body.error).toContain("No se puede eliminar");
      
      Producer.countDocuments = originalCount;
    });`,
);

// Fix 200 test
catCode = catCode.replace(
  /it\("debe devolver 200 si la categoría se elimina correctamente", async \(\) => {([\s\S]*?)const res = await supertest\(app\)/,
  `it("debe devolver 200 si la categoría se elimina correctamente", async () => {
      supabase.from = () => ({
        select: function() { return this; },
        eq:     function() { return this; },
        single: async function() { return { data: { nombre: "frutas" }, error: null }; },
        delete: function() { return { eq: async function() { return { error: null }; } }; },
      });

      const originalCount = Producer.countDocuments;
      Producer.countDocuments = async () => 0;

      const res = await supertest(app)`,
);
catCode = catCode.replace(
  /expect\(res\.body\.message\)\.toContain\("eliminada"\);\n\s*\}\);/,
  `expect(res.body.message).toContain("eliminada");

      Producer.countDocuments = originalCount;
    });`,
);

fs.writeFileSync("tests/categories.test.js", catCode);
console.log("Patch completed successfully.");
