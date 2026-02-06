#!/usr/bin/env node

/**
 * AmbuLink Monorepo Setup Script
 *
 * This script sets up the entire AmbuLink development environment:
 * - Docker containers (PostgreSQL + Redis)
 * - Environment files (.env)
 * - NPM dependencies for all projects
 * - Database migrations and seeding
 *
 * Requirements: Docker, Node.js 18+, npm
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${colors.bright}[${step}] ${message}${colors.reset}`, colors.cyan);
}

function logSuccess(message) {
  log(`✓ ${message}`, colors.green);
}

function logError(message) {
  log(`✗ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠ ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ ${message}`, colors.blue);
}

function exec(command, options = {}) {
  try {
    return execSync(command, {
      encoding: "utf8",
      stdio: options.silent ? "pipe" : "inherit",
      ...options,
    });
  } catch (error) {
    if (options.ignoreError) {
      return null;
    }
    throw error;
  }
}

function execSilent(command, options = {}) {
  return exec(command, { ...options, silent: true });
}

function checkCommandExists(command) {
  try {
    execSilent(`which ${command}`);
    return true;
  } catch {
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Pre-flight checks
async function preflightChecks() {
  logStep(1, "Running pre-flight checks");

  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split(".")[0].substring(1));

  if (majorVersion < 18) {
    logError(
      `Node.js version ${nodeVersion} is too old. Please install Node.js 18 or higher.`,
    );
    process.exit(1);
  }
  logSuccess(`Node.js ${nodeVersion} detected`);

  // Check npm
  if (!checkCommandExists("npm")) {
    logError("npm is not installed. Please install Node.js with npm.");
    process.exit(1);
  }
  const npmVersion = execSilent("npm --version").trim();
  logSuccess(`npm ${npmVersion} detected`);

  // Check Docker
  if (!checkCommandExists("docker")) {
    logError("Docker is not installed. Please install Docker Desktop.");
    logInfo("Visit: https://www.docker.com/products/docker-desktop");
    process.exit(1);
  }

  // Check if Docker daemon is running
  try {
    execSilent("docker info");
    logSuccess("Docker is installed and running");
  } catch {
    logError(
      "Docker is installed but not running. Please start Docker Desktop.",
    );
    process.exit(1);
  }

  logSuccess("All pre-flight checks passed");
}

// Docker container setup
async function setupDockerContainers() {
  logStep(2, "Setting up Docker containers");

  // PostgreSQL setup
  const postgresContainer = "postgres-db";
  const postgresImage = "postgis/postgis:18-3.6";
  const postgresPassword = "123";
  const postgresPort = "5432";

  try {
    const containerExists = execSilent(
      `docker ps -a --filter name=^${postgresContainer}$ --format "{{.Names}}"`,
      { ignoreError: true },
    );

    if (containerExists && containerExists.trim() === postgresContainer) {
      const isRunning = execSilent(
        `docker ps --filter name=^${postgresContainer}$ --format "{{.Names}}"`,
        { ignoreError: true },
      );

      if (isRunning && isRunning.trim() === postgresContainer) {
        logSuccess(
          `PostgreSQL container '${postgresContainer}' is already running`,
        );
      } else {
        logInfo(
          `Starting existing PostgreSQL container '${postgresContainer}'...`,
        );
        exec(`docker start ${postgresContainer}`);
        logSuccess(`PostgreSQL container started`);
      }
    } else {
      logInfo(`Creating PostgreSQL container '${postgresContainer}'...`);
      exec(
        `docker run --name ${postgresContainer} -e POSTGRES_PASSWORD=${postgresPassword} -p ${postgresPort}:${postgresPort} -d ${postgresImage}`,
      );
      logSuccess(`PostgreSQL container created and started`);
    }
  } catch (error) {
    logError(`Failed to setup PostgreSQL container: ${error.message}`);
    process.exit(1);
  }

  // // Redis setup
  // const redisContainer = 'redis';
  // const redisImage = 'redis:7-alpine';
  // const redisPort = '6379';

  // try {
  //   const containerExists = execSilent(`docker ps -a --filter name=^${redisContainer}$ --format "{{.Names}}"`, { ignoreError: true });

  //   if (containerExists && containerExists.trim() === redisContainer) {
  //     const isRunning = execSilent(`docker ps --filter name=^${redisContainer}$ --format "{{.Names}}"`, { ignoreError: true });

  //     if (isRunning && isRunning.trim() === redisContainer) {
  //       logSuccess(`Redis container '${redisContainer}' is already running`);
  //     } else {
  //       logInfo(`Starting existing Redis container '${redisContainer}'...`);
  //       exec(`docker start ${redisContainer}`);
  //       logSuccess(`Redis container started`);
  //     }
  //   } else {
  //     logInfo(`Creating Redis container '${redisContainer}'...`);
  //     exec(`docker run -d -p ${redisPort}:${redisPort} --name ${redisContainer} ${redisImage}`);
  //     logSuccess(`Redis container created and started`);
  //   }
  // } catch (error) {
  //   logError(`Failed to setup Redis container: ${error.message}`);
  //   process.exit(1);
  // }

  // Wait for containers to be ready
  logInfo("Waiting for databases to be ready...");
  await sleep(3000);

  // Check PostgreSQL is accepting connections
  let retries = 10;
  let connected = false;

  while (retries > 0 && !connected) {
    try {
      execSilent(`docker exec ${postgresContainer} pg_isready -U postgres`);
      connected = true;
      logSuccess("PostgreSQL is ready to accept connections");
    } catch {
      retries--;
      if (retries > 0) {
        logInfo(
          `Waiting for PostgreSQL to be ready... (${retries} retries left)`,
        );
        await sleep(2000);
      }
    }
  }

  if (!connected) {
    logError("PostgreSQL failed to start properly");
    process.exit(1);
  }

  logSuccess("Docker containers are ready");
}

// Setup environment files
async function setupEnvironmentFiles() {
  logStep(3, "Setting up environment files");

  const envFiles = [
    {
      source: path.join(__dirname, "backend", ".env.example"),
      target: path.join(__dirname, "backend", ".env"),
      name: "backend",
    },
    {
      source: path.join(__dirname, "mobile", ".env.example"),
      target: path.join(__dirname, "mobile", ".env"),
      name: "mobile",
    },
    {
      source: path.join(__dirname, "client-dashboard", ".env.example"),
      target: path.join(__dirname, "client-dashboard", ".env"),
      name: "client-dashboard",
    },
  ];

  for (const { source, target, name } of envFiles) {
    try {
      if (!fs.existsSync(source)) {
        logWarning(`No .env.example found for ${name}, skipping`);
        continue;
      }

      const content = fs.readFileSync(source, "utf8");
      fs.writeFileSync(target, content);
      logSuccess(`Created ${name}/.env`);
    } catch (error) {
      logError(`Failed to create ${name}/.env: ${error.message}`);
      process.exit(1);
    }
  }

  logSuccess("Environment files configured");
}

// Install dependencies
async function installDependencies() {
  logStep(4, "Installing dependencies");

  const projects = ["backend", "client-dashboard", "mobile"];

  logInfo("This may take a few minutes...\n");

  for (const project of projects) {
    const projectPath = path.join(__dirname, project);

    if (!fs.existsSync(path.join(projectPath, "package.json"))) {
      logWarning(`No package.json found in ${project}, skipping`);
      continue;
    }

    log(
      `\n${colors.bright}Installing dependencies for ${project}...${colors.reset}`,
      colors.cyan,
    );

    try {
      exec("npm install", { cwd: projectPath });
      logSuccess(`Dependencies installed for ${project}`);
    } catch (error) {
      logError(
        `Failed to install dependencies for ${project}: ${error.message}`,
      );
      process.exit(1);
    }
  }

  logSuccess("All dependencies installed");
}

// Database migrations and seeding
async function setupDatabase() {
  logStep(5, "Setting up database");

  const backendPath = path.join(__dirname, "backend");

  // Generate migrations
  logInfo("Generating database migrations...");
  try {
    exec("npm run generate", { cwd: backendPath });
    logSuccess("Migrations generated");
  } catch (error) {
    logWarning("Migration generation failed (may already exist)");
  }

  // Run migrations
  logInfo("Running database migrations...");
  try {
    exec("npm run migrate", { cwd: backendPath });
    logSuccess("Database migrations applied");
  } catch (error) {
    logError(`Failed to run migrations: ${error.message}`);
    process.exit(1);
  }

  // Seed database
  logInfo("Seeding database with initial data...");
  try {
    exec("npm run seed", { cwd: backendPath });
    logSuccess("Database seeded successfully");
  } catch (error) {
    logError(`Failed to seed database: ${error.message}`);
    process.exit(1);
  }

  logSuccess("Database setup complete");
}

// Verification and summary
async function verifyAndSummarize() {
  logStep(6, "Verification and Summary");

  // Verify containers are running
  try {
    const postgresRunning = execSilent(
      `docker ps --filter name=^postgres-db$ --format "{{.Names}}"`,
      { ignoreError: true },
    );
    // const redisRunning = execSilent(
    //   `docker ps --filter name=^redis$ --format "{{.names}}"`,
    //   { ignoreError: true },
    // );

    if (postgresRunning && postgresRunning.trim() === "postgres-db") {
      logSuccess("PostgreSQL is running on localhost:5432");
    } else {
      logWarning("PostgreSQL container not found");
    }

    // if (redisRunning && redisRunning.trim() === "redis") {
    //   logSuccess("Redis is running on localhost:6379");
    // } else {
    //   logWarning("Redis container not found");
    // }
  } catch (error) {
    logWarning("Could not verify container status");
  }

  logSuccess("All dependencies installed");
  logSuccess("Database migrations applied");
  logSuccess("Seed data loaded");

  log(
    `\n${colors.bright}${colors.green}==========================================`,
  );
  log("   Setup Complete! 🚀");
  log(`==========================================${colors.reset}\n`);

  log(`${colors.bright}Next steps:${colors.reset}\n`);
  log(`  Start all services with the existing script:`);
  log(`    ${colors.cyan}./dev.sh${colors.reset}\n`);

  log(`  Or start services individually:\n`);
  log(`  Backend:`);
  log(`    ${colors.cyan}cd backend && npm run start:dev${colors.reset}\n`);
  log(`  Client Dashboard:`);
  log(`    ${colors.cyan}cd client-dashboard && npm start${colors.reset}\n`);
  log(`  Mobile App:`);
  log(`    ${colors.cyan}cd mobile && npm start${colors.reset}\n`);

  log(`${colors.dim}Database credentials (from .env):`);
  log(`  PostgreSQL: postgresql://postgres:123@localhost:5432/postgres`);
  log(`  Redis: localhost:6379${colors.reset}\n`);
}

// Main execution
async function main() {
  log(
    `\n${colors.bright}${colors.cyan}==========================================`,
  );
  log("   AmbuLink Setup Script");
  log(`==========================================${colors.reset}\n`);

  try {
    await preflightChecks();
    await setupDockerContainers();
    await setupEnvironmentFiles();
    await installDependencies();
    await setupDatabase();
    await verifyAndSummarize();
  } catch (error) {
    logError(`\nSetup failed: ${error.message}`);
    log(colors.dim + error.stack + colors.reset);
    process.exit(1);
  }
}

// Run the script
main();
