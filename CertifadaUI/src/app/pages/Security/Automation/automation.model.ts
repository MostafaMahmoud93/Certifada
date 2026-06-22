export interface AutomationCondition {
  field: string;
  operator: string;
  value: string;
}

export interface Automation {
  id: number;
  name: string;
  process: string; // e.g., Templates, Credentials
  trigger: string;
  action: string;
  conditions: AutomationCondition[];
  enabled: boolean;
  fireOnAnyCondition: boolean;
}

export interface Automation {
  emailTemplate?: {
    subject: string;
    body: string;
  };
}
