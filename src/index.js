var Mustache = require('mustache');
var fs = require('fs');

// Getting template from external .mustache file didn't work
// So used a variable
const template = `import axios from "axios";
import getInfoByEncounter from "../utils/getInfoByEncounter";
import { allergyIntoleranceBuilder, requestBuilder } from "./mapper";
import { customLogger as logger } from "../../../lib/logger";

{{#getApi}}
export async function get{{ehrName}}Allergies(
  args,
  { url, token },
  loggerMetadata
) {
  return new Promise(async (resolve, reject) => {
    const { patient } = args;
    {{#patientRequired}}
    if (!patient) {
      return reject({
        statusCode: 400,
        message: "patient id is missing",
        status: "error",
      });
    }
    {{/patientRequired}}
    if (args?.encounter) {
      getInfoByEncounter(args, { url, token }, loggerMetadata, "Allergies")
        .then((response: []) => {
          logger.info(
            loggerMetadata
          );
          const entries = response?.map((allergy: any) => {
            const resource = allergyIntoleranceBuilder(allergy);
            resource["encounter"] = {
            };
            return { resource };
          });
          resolve({
            resourceType: "Bundle",
            type: "searchset",
            total: entries?.length,
            entry: entries,
          });
        })
        .catch((error) => {
          logger.error(error, loggerMetadata);
          logger.error(error?.response?.data, loggerMetadata);
          reject({
            statusCode: 500,
            message: "Internal server error",
            details: error?.response?.data,
          });
        });
    } else {
      const { _count, _offset, ...rest } = args;
      const requestParams = { ...rest, limit: _count, offset: _offset };
      await axios
        .get('allergies',{
          params: requestParams,
        })
        .then((response) => {
          logger.info('Successfully fetched allergies', loggerMetadata);
          const count = response?.data?.count;
          const entries = response?.data?.results?.map((allergy: any) => {
            const resource = allergyIntoleranceBuilder(allergy);
            return { resource };
          });
          resolve({
            resourceType: "Bundle",
            type: "searchset",
            total: count,
            entry: entries,
          });
        })
        .catch((error) => {
          logger.error(error, loggerMetadata);
          logger.error(error?.response?.data, loggerMetadata);
          reject({
            statusCode: 500,
            message: "Internal server error",
            details: error?.response?.data,
          });
        });
    }
  });
}
{{/getApi}}`;


let view = {
  ehrName: "Elation",
  getApi: true,
  patientRequired: true,
};

var output = Mustache.render(template, view);
fs.writeFileSync(__dirname + "/output/index.ts", output);