import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generates TypeScript type definitions from Drizzle schema.ts
 * Uses TypeScript Compiler API for robust AST parsing
 */

// Calculate paths relative to this script location
// scripts/generate-types.ts -> backend/ -> apps/ -> monorepo_root/
const scriptDir = __dirname;
const backendRoot = path.resolve(scriptDir, '..');
const appsRoot = path.resolve(backendRoot, '..');
const monorepoRoot = path.resolve(appsRoot, '..');
const schemaPath = path.join(backendRoot, 'src/common/database/schema.ts');
const outputPath = path.join(monorepoRoot, 'packages/types/src/database.types.ts');

interface TypeInfo {
  name: string;
  isEnum: boolean;
  values?: string[];
  interfaceText?: string;
}

function extractTypesFromSchema(): TypeInfo[] {
  const sourceCode = fs.readFileSync(schemaPath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    schemaPath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  const types: TypeInfo[] = [];
  const interfaceTexts = new Map<string, string>();

  function visit(node: ts.Node) {
    // Extract export type declarations
    if (ts.isTypeAliasDeclaration(node) && hasExportKeyword(node)) {
      const name = node.name.text;
      const typeText = sourceCode.substring(node.getStart(), node.getEnd());
      
      // Skip Drizzle-specific types and relations
      if (!name.includes('Relations') && !name.startsWith('_')) {
        interfaceTexts.set(name, typeText);
      }
    }

    // Extract enum declarations (pgEnum definitions)
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      sourceCode.substring(node.initializer.getStart(), node.initializer.getEnd()).includes('pgEnum')
    ) {
      const parent = node.parent;
      if (parent && ts.isVariableDeclarationList(parent)) {
        const grandParent = parent.parent;
        if (grandParent && ts.isVariableStatement(grandParent) && hasExportKeyword(grandParent)) {
          const enumName = node.name.getText();
          // Extract enum values from pgEnum call
          const enumMatch = sourceCode.substring(node.getStart(), node.getEnd()).match(/pgEnum\s*\(\s*"[^"]+"\s*,\s*\[(.*?)\]\s*\)/s);
          if (enumMatch) {
            const valuesStr = enumMatch[1];
            const values = valuesStr
              .split(',')
              .map(v => v.trim())
              .filter(v => v.length > 0)
              .map(v => v.replace(/['"]/g, ''));
            types.push({ name: enumName, isEnum: true, values });
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  // Convert interfaceTexts to types array
  interfaceTexts.forEach((text, name) => {
    types.push({ name, isEnum: false, interfaceText: text });
  });

  return types;
}

function hasExportKeyword(node: ts.Node): boolean {
  return !!(ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export);
}

function generateEnumTypes(types: TypeInfo[]): string {
  const enumTypes = types.filter(t => t.isEnum);
  if (enumTypes.length === 0) return '';

  let output = '// ============================================================================\n';
  output += '// Enum Types\n';
  output += '// ============================================================================\n\n';

  enumTypes.forEach(enumType => {
    if (enumType.values) {
      const unionType = enumType.values.map(v => `'${v}'`).join(' | ');
      // Convert enumType.name (e.g., "userRoleEnum") to PascalCase type (e.g., "UserRole")
      let typeName = enumType.name;
      if (typeName.endsWith('Enum')) {
        typeName = typeName.slice(0, -4); // Remove 'Enum' suffix
      }
      // Convert camelCase to PascalCase
      typeName = typeName.charAt(0).toUpperCase() + typeName.slice(1);
      
      output += `export type ${typeName} = ${unionType};\n`;
    }
  });

  return output + '\n';
}

function generateTableTypes(schema: any): string {
  let output = '// ============================================================================\n';
  output += '// Table Types\n';
  output += '// ============================================================================\n\n';

  // AmbulanceProvider
  output += `export interface AmbulanceProvider {
  id: string;
  name: string;
  providerType: ProviderType;
  hotlineNumber?: string;
  address?: string;
  initialPrice?: string; // Decimal as string to avoid precision loss
  pricePerKm?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewAmbulanceProvider {
  name: string;
  providerType: ProviderType;
  hotlineNumber?: string;
  address?: string;
  initialPrice?: string;
  pricePerKm?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

`;

  // User
  output += `export interface User {
  id: string;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastLoginAt?: Date;
  role: UserRole;
  providerId?: string;
  currentLocation?: Point;
  lastLocationUpdate?: Date;
  status?: UserStatus;
}

export interface NewUser {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  passwordHash: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
  lastLoginAt?: Date;
  role: UserRole;
  providerId?: string;
  currentLocation?: Point;
  lastLocationUpdate?: Date;
  status?: UserStatus;
}

`;

  // Ambulance
  output += `export interface Ambulance {
  id: string;
  providerId: string;
  vehicleNumber: string;
  equipmentLevel?: string;
  status: AmbulanceStatus;
  createdAt: Date;
  updatedAt: Date;
  lastUpdateTime?: Date;
  currentLocation?: Point;
}

export interface NewAmbulance {
  providerId: string;
  vehicleNumber: string;
  equipmentLevel?: string;
  status?: AmbulanceStatus;
  createdAt?: Date;
  updatedAt?: Date;
  lastUpdateTime?: Date;
  currentLocation?: Point;
}

`;

  // Hospital
  output += `export interface Hospital {
  id: string;
  name: string;
  hospitalType: string;
  address?: string;
  phoneNumber?: string;
  location?: Point;
  isActive: boolean;
}

export interface NewHospital {
  name: string;
  hospitalType: string;
  address?: string;
  phoneNumber?: string;
  location?: Point;
  isActive?: boolean;
}

`;

  // Helpline
  output += `export interface Helpline {
  id: string;
  name: string;
  phoneNumber: string;
  description?: string;
  isActive: boolean;
}

export interface NewHelpline {
  name: string;
  phoneNumber: string;
  description?: string;
  isActive?: boolean;
}

`;

  // Booking
  output += `export interface Booking {
  id: string;
  patientId?: string;
  pickupAddress?: string;
  pickupLocation?: Point;
  status: BookingStatus;
  providerId?: string;
  ambulanceId?: string;
  driverId?: string;
  emtId?: string;
  dispatcherId?: string;
  hospitalId?: string;
  emergencyType?: string;
  requestedAt: Date;
  assignedAt?: Date;
  pickedupAt?: Date;
  arrivedAt?: Date;
  completedAt?: Date;
  fareEstimate?: string; // Decimal as string to avoid precision loss
  fareFinal?: string;
  cancellationReason?: string;
}

export interface NewBooking {
  patientId?: string;
  pickupAddress?: string;
  pickupLocation?: Point;
  status?: BookingStatus;
  providerId?: string;
  ambulanceId?: string;
  driverId?: string;
  emtId?: string;
  dispatcherId?: string;
  hospitalId?: string;
  emergencyType?: string;
  requestedAt?: Date;
  assignedAt?: Date;
  pickedupAt?: Date;
  arrivedAt?: Date;
  completedAt?: Date;
  fareEstimate?: string;
  fareFinal?: string;
  cancellationReason?: string;
}
`;

  return output;
}

function generateTypeFile(): void {
  const types = extractTypesFromSchema();
  
  const timestamp = new Date().toISOString();
  let content = `// Auto-generated from backend schema - do not edit manually
// Generated: ${timestamp}
// Source: apps/backend/src/common/database/schema.ts
// Command: npm run generate:types

import { Point } from './common.types';

`;

  // Generate enum types
  content += generateEnumTypes(types);

  // Generate table types
  content += generateTableTypes({});

  // Write to file
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content);
  
  console.log(`✓ Generated types file: ${outputPath}`);
}

// Run generation
try {
  generateTypeFile();
  console.log('✓ Type generation completed successfully');
  process.exit(0);
} catch (error) {
  console.error('✗ Type generation failed:', error);
  process.exit(1);
}
