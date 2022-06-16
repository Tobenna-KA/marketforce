import * as path from "path";
import * as fs from "fs";
import glob from 'glob'
import Ajv from "ajv";
import AjvErrors from 'ajv-errors';

const ajv = new Ajv({
        logger: undefined,
        allErrors: true,
        useDefaults: 'empty'
    }
);

export const addSchemas = () => {
    const schemaFiles = glob.sync( './schemas/*.json')
    schemaFiles.forEach((file) => {
        const fileData = JSON.parse(fs.readFileSync(file, 'utf-8'))
        ajv.addSchema(fileData, path.basename(file, '.json'))
    });


    ajv.addKeyword('arrayNotEmpty', {
        validate: function validate(schema, data) {
            if (!Array.isArray(data)) {
                validate.errors =
                    [{ keyword: 'arrayNotEmpty', message: 'Must be an array', params: { keyword: 'arrayNotEmpty' } }]
                return false
            }
            
            if (data.length < 1) {
                validate.errors =
                    [{ keyword: 'arrayNotEmpty', message: 'Array cannot be empty', params: { keyword: 'arrayNotEmpty' } }]
                
                return false
            }
            
            return true
        },
        errors: true
    });
    
    AjvErrors(ajv);
};

export const validateJson = (schema, json) => {
    const result = ajv.validate(schema, json);
    return {
        result,
        errors: ajv.errors
    };
};

export const extractSchemaError = (schema) => schema.errors[0] ?
        `${schema.errors[0].dataPath} ${schema.errors[0].message}`: 'Error: Something went wrong'
