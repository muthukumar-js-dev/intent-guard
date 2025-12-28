/**
 * Simple JSON schema validator
 * (In production, consider using ajv or similar library)
 */

interface ValidationResult {
    valid: boolean;
    errors: string[];
}

export function validateSchema(data: unknown, schema: unknown): ValidationResult {
    const errors: string[] = [];

    function validate(value: unknown, schemaNode: Record<string, unknown>, path: string = 'root'): void {
        // Check required fields
        if (schemaNode.required && typeof value === 'object' && value !== null) {
            for (const requiredField of schemaNode.required as string[]) {
                if (!(requiredField in value)) {
                    errors.push(`Missing required field: ${path}.${requiredField}`);
                }
            }
        }

        // Check type
        if (schemaNode.type) {
            const actualType = Array.isArray(value) ? 'array' : typeof value;
            if (actualType !== schemaNode.type) {
                errors.push(
                    `Type mismatch at ${path}: expected ${schemaNode.type}, got ${actualType}`
                );
                return; // Don't continue if type is wrong
            }
        }

        // Check pattern (for strings)
        if (schemaNode.pattern && typeof value === 'string') {
            const regex = new RegExp(schemaNode.pattern as string);
            if (!regex.test(value)) {
                errors.push(
                    `Value at ${path} does not match pattern ${schemaNode.pattern}: "${value}"`
                );
            }
        }

        // Check array items
        if (schemaNode.type === 'array' && Array.isArray(value)) {
            if (schemaNode.minItems && value.length < (schemaNode.minItems as number)) {
                errors.push(
                    `Array at ${path} has ${value.length} items, minimum is ${schemaNode.minItems}`
                );
            }

            if (schemaNode.items) {
                value.forEach((item, index) => {
                    validate(item, schemaNode.items as Record<string, unknown>, `${path}[${index}]`);
                });
            }
        }

        // Check object properties
        if (schemaNode.type === 'object' && schemaNode.properties && typeof value === 'object' && value !== null) {
            for (const [key, propSchema] of Object.entries(schemaNode.properties as Record<string, unknown>)) {
                if (key in value) {
                    validate((value as Record<string, unknown>)[key], propSchema as Record<string, unknown>, `${path}.${key}`);
                }
            }
        }
    }

    validate(data, schema as Record<string, unknown>);

    return {
        valid: errors.length === 0,
        errors,
    };
}
