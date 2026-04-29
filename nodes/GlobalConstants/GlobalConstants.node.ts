import { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { GLOBAL_CONSTANTS_CREDENTIALS_NAME, GlobalConstantsCredentialsData } from '../../credentials/GlobalConstantsCredentials.credentials';
import { splitConstants } from '../../credentials/CredentialsUtils';


export class GlobalConstants implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Global Constants',
    name: 'globalConstants',
    // eslint-disable-next-line n8n-nodes-base/node-class-description-icon-not-svg
    icon: 'file:globals-icon-60px.png',
    group: ['transform', 'output'],
    version: 1,
    description: 'Global Constants',
    subtitle: '={{$parameter["putAllInOneKey"] ? "grouped under \'" + $parameter["constantsKeyName"] + "\'" : "flat"}}{{$parameter["exposeSecrets"] ? " · secrets exposed" : ""}}',
    usableAsTool: true,
    defaults: {
      name: 'Global Constants',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: GLOBAL_CONSTANTS_CREDENTIALS_NAME,
        required: true,
      }
    ],
    properties: [
      {
        displayName: 'Put All Constants in One Key',
        name: 'putAllInOneKey',
        type: "boolean",
        default: true,
        description: "Whether to put all constants in one key or use separate keys for each constant",
      },
      {
        displayName: 'Constants Key Name',
        name: 'constantsKeyName',
        type: 'string',
        default: 'constants',
        description: 'The key under which all constants will be grouped in the output item',
        displayOptions: {
          show: {
            putAllInOneKey: [true],
          },
        },
      },
      {
        displayName: 'Expose Secrets in Output',
        name: 'exposeSecrets',
        type: 'boolean',
        default: false,
        description: 'Whether to include secret constants in the output item. When enabled, secret values will be visible in execution logs.',
      },
      {
        displayName: 'Secrets Key Name',
        name: 'secretsKeyName',
        type: 'string',
        default: 'secrets',
        description: 'The key under which all secret constants will be grouped in the output item',
        displayOptions: {
          show: {
            exposeSecrets: [true],
          },
        },
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    try {
      const credentials = await this.getCredentials(GLOBAL_CONSTANTS_CREDENTIALS_NAME) as unknown as GlobalConstantsCredentialsData;
      const globalConstants = splitConstants(credentials.globalConstants, credentials.format);

      const putAllInOneKey = this.getNodeParameter('putAllInOneKey', 0) as boolean;

      let constantsData: { [key: string]: any };

      if (putAllInOneKey) {
        const constantsKeyName = this.getNodeParameter('constantsKeyName', 0) as string;
        constantsData = {
          [constantsKeyName]: globalConstants,
        };
      } else {
        constantsData = globalConstants;
      }

      const exposeSecrets = this.getNodeParameter('exposeSecrets', 0) as boolean;
      if (exposeSecrets && credentials.secretConstants?.trim()) {
        const secretsKeyName = this.getNodeParameter('secretsKeyName', 0) as string;
        constantsData[secretsKeyName] = splitConstants(credentials.secretConstants, credentials.format);
      }

      const inputData = this.getInputData();
      if (inputData.length === 0) {
        return [[{ json: constantsData }]];
      }

      const returnData: INodeExecutionData[] = inputData.map((item, index) => ({
        json: { ...item.json, ...constantsData },
        binary: item.binary,
        pairedItem: { item: index },
      }));

      return [returnData];
    } catch (error) {
      if (this.continueOnFail()) {
        return [[{ json: { error: (error as Error).message } }]];
      }
      throw error;
    }
  }
}

