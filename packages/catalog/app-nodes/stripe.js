// Editor-only descriptor for n8n's current Stripe v1 action node.
// Credentials, dynamic lookups, card data, API calls, and every mutation remain inert.

const sourceCommit = '3d68c29b9281f14097aa9f15e01ac0777e538b11';
const lockedCredentialNote =
  'This credential selector is locked. The simulation never creates, reads, tests, authenticates, or applies Stripe credentials.';
const lockedLookupNote =
  'This option list normally loads from Stripe. The method is retained as metadata, but the list is locked, empty, and never performs a request.';

const rawBundle = {"operations":{"balance":{"displayName":"Operation","name":"operation","type":"options","noDataExpression":true,"default":"get","options":[{"name":"Get","value":"get","description":"Get a balance","action":"Get a balance"}],"displayOptions":{"show":{"resource":["balance"]}}},"charge":{"displayName":"Operation","name":"operation","type":"options","noDataExpression":true,"default":"get","options":[{"name":"Create","value":"create","description":"Create a charge","action":"Create a charge"},{"name":"Get","value":"get","description":"Get a charge","action":"Get a charge"},{"name":"Get Many","value":"getAll","description":"Get many charges","action":"Get many charges"},{"name":"Update","value":"update","description":"Update a charge","action":"Update a charge"}],"displayOptions":{"show":{"resource":["charge"]}}},"coupon":{"displayName":"Operation","name":"operation","type":"options","noDataExpression":true,"default":"create","options":[{"name":"Create","value":"create","description":"Create a coupon","action":"Create a coupon"},{"name":"Get Many","value":"getAll","description":"Get many coupons","action":"Get many coupons"}],"displayOptions":{"show":{"resource":["coupon"]}}},"customer":{"displayName":"Operation","name":"operation","type":"options","noDataExpression":true,"default":"get","options":[{"name":"Create","value":"create","description":"Create a customer","action":"Create a customer"},{"name":"Delete","value":"delete","description":"Delete a customer","action":"Delete a customer"},{"name":"Get","value":"get","description":"Get a customer","action":"Get a customer"},{"name":"Get Many","value":"getAll","description":"Get many customers","action":"Get many customers"},{"name":"Update","value":"update","description":"Update a customer","action":"Update a customer"}],"displayOptions":{"show":{"resource":["customer"]}}},"customerCard":{"displayName":"Operation","name":"operation","type":"options","noDataExpression":true,"default":"get","options":[{"name":"Add","value":"add","description":"Add a customer card","action":"Add a customer card"},{"name":"Get","value":"get","description":"Get a customer card","action":"Get a customer card"},{"name":"Remove","value":"remove","description":"Remove a customer card","action":"Remove a customer card"}],"displayOptions":{"show":{"resource":["customerCard"]}}},"meterEvent":{"displayName":"Operation","name":"operation","type":"options","noDataExpression":true,"default":"create","options":[{"name":"Create","value":"create","description":"Create a meter event","action":"Create a meter event"}],"displayOptions":{"show":{"resource":["meterEvent"]}}},"source":{"displayName":"Operation","name":"operation","type":"options","noDataExpression":true,"default":"get","options":[{"name":"Create","value":"create","description":"Create a source","action":"Create a source"},{"name":"Delete","value":"delete","description":"Delete a source","action":"Delete a source"},{"name":"Get","value":"get","description":"Get a source","action":"Get a source"}],"displayOptions":{"show":{"resource":["source"]}}},"token":{"displayName":"Operation","name":"operation","type":"options","noDataExpression":true,"default":"create","options":[{"name":"Create","value":"create","description":"Create a token","action":"Create a token"}],"displayOptions":{"show":{"resource":["token"]}}}},"fields":[{"displayName":"Customer ID","name":"customerId","type":"string","required":true,"default":"","description":"ID of the customer to be associated with this card","displayOptions":{"show":{"resource":["customerCard"],"operation":["add"]}}},{"displayName":"Card Token","name":"token","type":"string","typeOptions":{"password":true},"required":true,"default":"","placeholder":"tok_1IMfKdJhRTnqS5TKQVG1LI9o","description":"Token representing sensitive card information","displayOptions":{"show":{"resource":["customerCard"],"operation":["add"]}}},{"displayName":"Customer ID","name":"customerId","type":"string","required":true,"default":"","description":"ID of the customer whose card to remove","displayOptions":{"show":{"resource":["customerCard"],"operation":["remove"]}}},{"displayName":"Card ID","name":"cardId","type":"string","required":true,"default":"","description":"ID of the card to remove","displayOptions":{"show":{"resource":["customerCard"],"operation":["remove"]}}},{"displayName":"Customer ID","name":"customerId","type":"string","required":true,"default":"","description":"ID of the customer whose card to retrieve","displayOptions":{"show":{"resource":["customerCard"],"operation":["get"]}}},{"displayName":"Source ID","name":"sourceId","type":"string","required":true,"default":"","description":"ID of the source to retrieve","displayOptions":{"show":{"resource":["customerCard"],"operation":["get"]}}},{"displayName":"Customer ID","name":"customerId","type":"string","required":true,"default":"","description":"ID of the customer to be associated with this charge","displayOptions":{"show":{"resource":["charge"],"operation":["create"]}}},{"displayName":"Amount","name":"amount","type":"number","required":true,"default":0,"description":"Amount in cents to be collected for this charge, e.g. enter <code>100</code> for $1.00","typeOptions":{"minValue":0,"maxValue":99999999},"displayOptions":{"show":{"resource":["charge"],"operation":["create"]}}},{"displayName":"Currency Name or ID","name":"currency","type":"options","typeOptions":{"loadOptionsMethod":"getCurrencies"},"required":true,"default":"","description":"Three-letter ISO currency code, e.g. <code>USD</code> or <code>EUR</code>. It must be a <a href=\"https://stripe.com/docs/currencies\">Stripe-supported currency</a>. Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code/expressions/\">expression</a>.","displayOptions":{"show":{"resource":["charge"],"operation":["create"]}}},{"displayName":"Source ID","name":"source","type":"string","required":true,"default":"","description":"ID of the customer's payment source to be charged","displayOptions":{"show":{"resource":["charge"],"operation":["create"]}}},{"displayName":"Additional Fields","name":"additionalFields","type":"collection","placeholder":"Add Field","default":{},"displayOptions":{"show":{"resource":["charge"],"operation":["create"]}},"options":[{"displayName":"Description","name":"description","type":"string","default":"","description":"Arbitrary text to describe the charge to create"},{"displayName":"Metadata","name":"metadata","type":"fixedCollection","default":[],"placeholder":"Add Metadata Item","description":"Set of key-value pairs to attach to the charge to create","typeOptions":{"multipleValues":true},"options":[{"displayName":"Metadata Properties","name":"metadataProperties","values":[{"displayName":"Key","name":"key","type":"string","default":""},{"displayName":"Value","name":"value","type":"string","default":""}]}]},{"displayName":"Receipt Email","name":"receipt_email","type":"string","default":"","description":"Email address to which the receipt for this charge will be sent"},{"displayName":"Shipping","name":"shipping","type":"fixedCollection","description":"Shipping information for the charge","placeholder":"Add Field","typeOptions":{"multipleValues":true},"default":[],"options":[{"displayName":"Shipping Properties","name":"shippingProperties","values":[{"displayName":"Recipient Name","name":"name","type":"string","description":"Name of the person who will receive the shipment","default":""},{"displayName":"Address","name":"address","type":"fixedCollection","default":{},"placeholder":"Add Field","options":[{"displayName":"Details","name":"details","values":[{"displayName":"Line 1","name":"line1","description":"Address line 1 (e.g. street, PO Box, or company name)","type":"string","default":""},{"displayName":"Line 2","name":"line2","description":"Address line 2 (e.g. apartment, suite, unit, or building)","type":"string","default":""},{"displayName":"City","name":"city","description":"City, district, suburb, town, or village","type":"string","default":""},{"displayName":"State","name":"state","description":"State, county, province, or region","type":"string","default":""},{"displayName":"Country","name":"country","description":"Two-letter country code (<a href=\"https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2\">ISO 3166-1 alpha-2</a>)","type":"string","default":""},{"displayName":"Postal Code","name":"postal_code","description":"ZIP or postal code","type":"string","default":""}]}]}]}]}]},{"displayName":"Charge ID","name":"chargeId","type":"string","required":true,"default":"","description":"ID of the charge to retrieve","displayOptions":{"show":{"resource":["charge"],"operation":["get"]}}},{"displayName":"Return All","name":"returnAll","type":"boolean","default":false,"description":"Whether to return all results or only up to a given limit","displayOptions":{"show":{"resource":["charge"],"operation":["getAll"]}}},{"displayName":"Limit","name":"limit","type":"number","default":50,"description":"Max number of results to return","typeOptions":{"minValue":1,"maxValue":1000},"displayOptions":{"show":{"resource":["charge"],"operation":["getAll"],"returnAll":[false]}}},{"displayName":"Charge ID","name":"chargeId","type":"string","required":true,"default":"","description":"ID of the charge to update","displayOptions":{"show":{"resource":["charge"],"operation":["update"]}}},{"displayName":"Update Fields","name":"updateFields","type":"collection","placeholder":"Add Field","default":{},"displayOptions":{"show":{"resource":["charge"],"operation":["update"]}},"options":[{"displayName":"Description","name":"description","type":"string","default":"","description":"Arbitrary text to describe the charge to update"},{"displayName":"Metadata","name":"metadata","type":"fixedCollection","default":{},"placeholder":"Add Metadata Item","description":"Set of key-value pairs to attach to the charge to update","typeOptions":{"multipleValues":true},"options":[{"displayName":"Metadata Properties","name":"metadataProperties","values":[{"displayName":"Key","name":"key","type":"string","default":""},{"displayName":"Value","name":"value","type":"string","default":""}]}]},{"displayName":"Receipt Email","name":"receipt_email","type":"string","default":"","description":"The email address to which the receipt for this charge will be sent"},{"displayName":"Shipping","name":"shipping","type":"fixedCollection","default":{},"description":"Shipping information for the charge","placeholder":"Add Field","typeOptions":{"multipleValues":true},"options":[{"displayName":"Shipping Properties","name":"shippingProperties","default":{},"values":[{"displayName":"Recipient Name","name":"name","type":"string","default":""},{"displayName":"Recipient Address","name":"address","type":"fixedCollection","default":{},"placeholder":"Add Address Details","options":[{"displayName":"Details","name":"details","values":[{"displayName":"Line 1","name":"line1","description":"Address line 1 (e.g. street, PO Box, or company name)","type":"string","default":""},{"displayName":"Line 2","name":"line2","description":"Address line 2 (e.g. apartment, suite, unit, or building)","type":"string","default":""},{"displayName":"City","name":"city","description":"City, district, suburb, town, or village","type":"string","default":""},{"displayName":"State","name":"state","description":"State, county, province, or region","type":"string","default":""},{"displayName":"Country","name":"country","description":"Two-letter country code (<a href=\"https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2\">ISO 3166-1 alpha-2</a>)","type":"string","default":""},{"displayName":"Postal Code","name":"postal_code","description":"ZIP or postal code","type":"string","default":""}]}]}]}]}]},{"displayName":"Apply","name":"duration","type":"options","required":true,"default":"once","description":"How long the discount will be in effect","options":[{"name":"Forever","value":"forever"},{"name":"Once","value":"once"}],"displayOptions":{"show":{"resource":["coupon"],"operation":["create"]}}},{"displayName":"Discount Type","name":"type","type":"options","required":true,"default":"percent","description":"Whether the coupon discount is a percentage or a fixed amount","options":[{"name":"Fixed Amount (in Cents)","value":"fixedAmount"},{"name":"Percent","value":"percent"}],"displayOptions":{"show":{"resource":["coupon"],"operation":["create"]}}},{"displayName":"Amount Off","name":"amountOff","type":"number","required":true,"default":0,"description":"Amount in cents to subtract from an invoice total, e.g. enter <code>100</code> for $1.00","typeOptions":{"minValue":0,"maxValue":99999999},"displayOptions":{"show":{"resource":["coupon"],"operation":["create"],"type":["fixedAmount"]}}},{"displayName":"Currency Name or ID","name":"currency","type":"options","typeOptions":{"loadOptionsMethod":"getCurrencies"},"required":true,"default":"","description":"Three-letter ISO currency code, e.g. <code>USD</code> or <code>EUR</code>. It must be a <a href=\"https://stripe.com/docs/currencies\">Stripe-supported currency</a>. Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code/expressions/\">expression</a>.","displayOptions":{"show":{"resource":["coupon"],"operation":["create"],"type":["fixedAmount"]}}},{"displayName":"Percent Off","name":"percentOff","type":"number","required":true,"default":1,"description":"Percentage to apply with the coupon","typeOptions":{"minValue":1,"maxValue":100},"displayOptions":{"show":{"resource":["coupon"],"operation":["create"],"type":["percent"]}}},{"displayName":"Return All","name":"returnAll","type":"boolean","default":false,"description":"Whether to return all results or only up to a given limit","displayOptions":{"show":{"resource":["coupon"],"operation":["getAll"]}}},{"displayName":"Limit","name":"limit","type":"number","default":50,"description":"Max number of results to return","typeOptions":{"minValue":1,"maxValue":1000},"displayOptions":{"show":{"resource":["coupon"],"operation":["getAll"],"returnAll":[false]}}},{"displayName":"Name","name":"name","type":"string","required":true,"default":"","description":"Full name or business name of the customer to create","displayOptions":{"show":{"resource":["customer"],"operation":["create"]}}},{"displayName":"Additional Fields","name":"additionalFields","type":"collection","placeholder":"Add Field","default":{},"displayOptions":{"show":{"resource":["customer"],"operation":["create"]}},"options":[{"displayName":"Address","name":"address","type":"fixedCollection","description":"Address of the customer to create","placeholder":"Add Field","default":{},"options":[{"displayName":"Details","name":"details","values":[{"displayName":"Line 1","name":"line1","description":"Address line 1 (e.g. street, PO Box, or company name)","type":"string","default":""},{"displayName":"Line 2","name":"line2","description":"Address line 2 (e.g. apartment, suite, unit, or building)","type":"string","default":""},{"displayName":"City","name":"city","description":"City, district, suburb, town, or village","type":"string","default":""},{"displayName":"State","name":"state","description":"State, county, province, or region","type":"string","default":""},{"displayName":"Country","name":"country","description":"Two-letter country code (<a href=\"https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2\">ISO 3166-1 alpha-2</a>)","type":"string","default":""},{"displayName":"Postal Code","name":"postal_code","description":"ZIP or postal code","type":"string","default":""}]}]},{"displayName":"Description","name":"description","type":"string","default":"","description":"Arbitrary text to describe the customer to create"},{"displayName":"Email","name":"email","type":"string","placeholder":"name@email.com","default":"","description":"Email of the customer to create"},{"displayName":"Metadata","name":"metadata","type":"fixedCollection","default":{},"placeholder":"Add Metadata Item","description":"Set of key-value pairs to attach to the customer to create","typeOptions":{"multipleValues":true},"options":[{"displayName":"Metadata Properties","name":"metadataProperties","values":[{"displayName":"Key","name":"key","type":"string","default":""},{"displayName":"Value","name":"value","type":"string","default":""}]}]},{"displayName":"Phone","name":"phone","type":"string","default":"","description":"Telephone number of the customer to create"},{"displayName":"Shipping","name":"shipping","type":"fixedCollection","default":{},"description":"Shipping information for the customer","typeOptions":{"multipleValues":true},"placeholder":"Add Field","options":[{"displayName":"Shipping Properties","name":"shippingProperties","values":[{"displayName":"Recipient Name","name":"name","type":"string","default":""},{"displayName":"Recipient Address","name":"address","type":"fixedCollection","default":{},"placeholder":"Add Address Details","options":[{"displayName":"Details","name":"details","values":[{"displayName":"Line 1","name":"line1","description":"Address line 1 (e.g. street, PO Box, or company name)","type":"string","default":""},{"displayName":"Line 2","name":"line2","description":"Address line 2 (e.g. apartment, suite, unit, or building)","type":"string","default":""},{"displayName":"City","name":"city","description":"City, district, suburb, town, or village","type":"string","default":""},{"displayName":"State","name":"state","description":"State, county, province, or region","type":"string","default":""},{"displayName":"Country","name":"country","description":"Two-letter country code (<a href=\"https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2\">ISO 3166-1 alpha-2</a>)","type":"string","default":""},{"displayName":"Postal Code","name":"postal_code","description":"ZIP or postal code","type":"string","default":""}]}]},{"displayName":"Recipient Phone","name":"phone","type":"string","default":""}]}]}]},{"displayName":"Customer ID","name":"customerId","type":"string","required":true,"default":"","description":"ID of the customer to delete","displayOptions":{"show":{"resource":["customer"],"operation":["delete"]}}},{"displayName":"Customer ID","name":"customerId","type":"string","required":true,"default":"","description":"ID of the customer to retrieve","displayOptions":{"show":{"resource":["customer"],"operation":["get"]}}},{"displayName":"Return All","name":"returnAll","type":"boolean","default":false,"description":"Whether to return all results or only up to a given limit","displayOptions":{"show":{"resource":["customer"],"operation":["getAll"]}}},{"displayName":"Limit","name":"limit","type":"number","default":50,"description":"Max number of results to return","typeOptions":{"minValue":1,"maxValue":1000},"displayOptions":{"show":{"resource":["customer"],"operation":["getAll"],"returnAll":[false]}}},{"displayName":"Filters","name":"filters","type":"collection","placeholder":"Add Filter","default":{},"displayOptions":{"show":{"resource":["customer"],"operation":["getAll"]}},"options":[{"displayName":"Email","name":"email","type":"string","placeholder":"name@email.com","default":"","description":"Customer's email to filter by"}]},{"displayName":"Customer ID","name":"customerId","type":"string","required":true,"default":"","description":"ID of the customer to update","displayOptions":{"show":{"resource":["customer"],"operation":["update"]}}},{"displayName":"Update Fields","name":"updateFields","type":"collection","placeholder":"Add Field","default":{},"displayOptions":{"show":{"resource":["customer"],"operation":["update"]}},"options":[{"displayName":"Address","name":"address","type":"fixedCollection","description":"Address of the customer to update","placeholder":"Add Field","default":{},"options":[{"displayName":"Details","name":"details","values":[{"displayName":"Line 1","name":"line1","description":"Address line 1 (e.g. street, PO Box, or company name)","type":"string","default":""},{"displayName":"Line 2","name":"line2","description":"Address line 2 (e.g. apartment, suite, unit, or building)","type":"string","default":""},{"displayName":"City","name":"city","description":"City, district, suburb, town, or village","type":"string","default":""},{"displayName":"State","name":"state","description":"State, county, province, or region","type":"string","default":""},{"displayName":"Country","name":"country","description":"Two-letter country code (<a href=\"https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2\">ISO 3166-1 alpha-2</a>)","type":"string","default":""},{"displayName":"Postal Code","name":"postal_code","description":"ZIP or postal code","type":"string","default":""}]}]},{"displayName":"Description","name":"description","type":"string","default":"","description":"Arbitrary text to describe the customer to create"},{"displayName":"Email","name":"email","type":"string","placeholder":"name@email.com","default":"","description":"Email of the customer to create"},{"displayName":"Metadata","name":"metadata","type":"fixedCollection","default":{},"placeholder":"Add Metadata Item","description":"Set of key-value pairs to attach to the customer to create","typeOptions":{"multipleValues":true},"options":[{"displayName":"Metadata Properties","name":"metadataProperties","values":[{"displayName":"Key","name":"key","type":"string","default":""},{"displayName":"Value","name":"value","type":"string","default":""}]}]},{"displayName":"Name","name":"name","type":"string","default":"","description":"Full name or business name of the customer to create"},{"displayName":"Phone","name":"phone","type":"string","default":"","description":"Telephone number of this customer"},{"displayName":"Shipping","name":"shipping","type":"fixedCollection","description":"Shipping information for the customer","placeholder":"Add Field","typeOptions":{"multipleValues":true},"default":{},"options":[{"displayName":"Shipping Properties","name":"shippingProperties","values":[{"displayName":"Recipient Name","name":"name","type":"string","default":"","description":"Name of the person who will receive the shipment"},{"displayName":"Recipient Address","name":"address","type":"fixedCollection","default":{},"placeholder":"Add Address Details","options":[{"displayName":"Details","name":"details","values":[{"displayName":"Line 1","name":"line1","description":"Address line 1 (e.g. street, PO Box, or company name)","type":"string","default":""},{"displayName":"Line 2","name":"line2","description":"Address line 2 (e.g. apartment, suite, unit, or building)","type":"string","default":""},{"displayName":"City","name":"city","description":"City, district, suburb, town, or village","type":"string","default":""},{"displayName":"State","name":"state","description":"State, county, province, or region","type":"string","default":""},{"displayName":"Country","name":"country","description":"Two-letter country code (<a href=\"https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2\">ISO 3166-1 alpha-2</a>)","type":"string","default":""},{"displayName":"Postal Code","name":"postal_code","description":"ZIP or postal code","type":"string","default":""}]}]},{"displayName":"Recipient Phone","name":"phone","type":"string","default":"","description":"Phone number of the person who will receive the shipment"}]}]}]},{"displayName":"Event Name","name":"eventName","type":"string","required":true,"default":"","description":"The name of the meter event. Corresponds with the event_name field on a meter.","displayOptions":{"show":{"resource":["meterEvent"],"operation":["create"]}}},{"displayName":"Customer ID","name":"customerId","type":"string","required":true,"default":"","description":"The Stripe customer ID associated with this meter event","displayOptions":{"show":{"resource":["meterEvent"],"operation":["create"]}}},{"displayName":"Value","name":"value","type":"number","required":true,"default":1,"description":"The value of the meter event. Must be an integer. Can be positive or negative.","displayOptions":{"show":{"resource":["meterEvent"],"operation":["create"]}}},{"displayName":"Additional Fields","name":"additionalFields","type":"collection","placeholder":"Add Field","default":{},"displayOptions":{"show":{"resource":["meterEvent"],"operation":["create"]}},"options":[{"displayName":"Identifier","name":"identifier","type":"string","default":"","description":"A unique identifier for the event. If not provided, one will be generated. Uniqueness is enforced within a rolling 24 hour window."},{"displayName":"Timestamp","name":"timestamp","type":"dateTime","default":"","description":"The time of the event. Measured in seconds since the Unix epoch. Must be within the past 35 calendar days or up to 5 minutes in the future. Defaults to current time if not specified."},{"displayName":"Custom Payload Properties","name":"customPayload","type":"fixedCollection","default":{},"placeholder":"Add Custom Property","description":"Additional custom properties to include in the event payload. Use this for custom meter configurations with non-default payload keys.","typeOptions":{"multipleValues":true},"options":[{"displayName":"Properties","name":"properties","values":[{"displayName":"Key","name":"key","type":"string","default":"","description":"The property key"},{"displayName":"Value","name":"value","type":"string","default":"","description":"The property value"}]}]}]},{"displayName":"Customer ID","name":"customerId","type":"string","required":true,"default":"","description":"ID of the customer to attach the source to","displayOptions":{"show":{"resource":["source"],"operation":["create"]}}},{"displayName":"Type","name":"type","type":"options","required":true,"default":"wechat","description":"Type of source (payment instrument) to create","options":[{"name":"WeChat","value":"wechat"}],"displayOptions":{"show":{"resource":["source"],"operation":["create"]}}},{"displayName":"Amount","name":"amount","type":"number","default":0,"description":"Amount in cents to be collected for this charge, e.g. enter <code>100</code> for $1.00","typeOptions":{"minValue":0,"maxValue":99999999},"displayOptions":{"show":{"resource":["source"],"operation":["create"]}}},{"displayName":"Currency Name or ID","name":"currency","type":"options","typeOptions":{"loadOptionsMethod":"getCurrencies"},"default":"","description":"Three-letter ISO currency code, e.g. <code>USD</code> or <code>EUR</code>. It must be a <a href=\"https://stripe.com/docs/currencies\">Stripe-supported currency</a>. Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code/expressions/\">expression</a>.","displayOptions":{"show":{"resource":["source"],"operation":["create"]}}},{"displayName":"Additional Fields","name":"additionalFields","type":"collection","placeholder":"Add Field","default":{},"displayOptions":{"show":{"resource":["source"],"operation":["create"]}},"options":[{"displayName":"Metadata","name":"metadata","type":"fixedCollection","placeholder":"Add Metadata Item","description":"Set of key-value pairs to attach to the source to create","default":{},"typeOptions":{"multipleValues":true},"options":[{"displayName":"Metadata Properties","name":"metadataProperties","values":[{"displayName":"Key","name":"key","type":"string","default":""},{"displayName":"Value","name":"value","type":"string","default":""}]}]},{"displayName":"Statement Descriptor","name":"statement_descriptor","type":"string","default":"","description":"Arbitrary text to display on the customer's statement"}]},{"displayName":"Customer ID","name":"customerId","type":"string","required":true,"default":"","description":"ID of the customer whose source to delete","displayOptions":{"show":{"resource":["source"],"operation":["delete"]}}},{"displayName":"Source ID","name":"sourceId","type":"string","required":true,"default":"","description":"ID of the source to delete","displayOptions":{"show":{"resource":["source"],"operation":["delete"]}}},{"displayName":"Source ID","name":"sourceId","type":"string","required":true,"default":"","description":"ID of the source to retrieve","displayOptions":{"show":{"resource":["source"],"operation":["get"]}}},{"displayName":"Type","name":"type","type":"options","required":true,"default":"cardToken","description":"Type of token to create","options":[{"name":"Card Token","value":"cardToken"}],"displayOptions":{"show":{"resource":["token"],"operation":["create"]}}},{"displayName":"Card Number","name":"number","type":"string","displayOptions":{"show":{"resource":["token"],"operation":["create"],"type":["cardToken"]}},"placeholder":"4242424242424242","default":""},{"displayName":"CVC","name":"cvc","type":"string","displayOptions":{"show":{"resource":["token"],"operation":["create"],"type":["cardToken"]}},"default":"","placeholder":"314","description":"Security code printed on the back of the card"},{"displayName":"Expiration Month","description":"Number of the month when the card will expire","name":"expirationMonth","type":"string","displayOptions":{"show":{"resource":["token"],"operation":["create"],"type":["cardToken"]}},"default":"","placeholder":"10"},{"displayName":"Expiration Year","description":"Year when the card will expire","name":"expirationYear","type":"string","displayOptions":{"show":{"resource":["token"],"operation":["create"],"type":["cardToken"]}},"default":"","placeholder":"2022"}],"sourcePropertyCount":58,"sourceTreeFieldCount":134};

const resourceOrder = ['balance', 'charge', 'coupon', 'customer', 'customerCard', 'meterEvent', 'source', 'token'];
const resourceLabels = {
  balance: 'Balance',
  charge: 'Charge',
  coupon: 'Coupon',
  customer: 'Customer',
  customerCard: 'Customer Card',
  meterEvent: 'Meter Event',
  source: 'Source',
  token: 'Token',
};

const pascal = (value) => String(value)
  .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
  .replace(/^(.)/, (_, char) => char.toUpperCase());

const sourceContext = (property) => ({
  resources: property.displayOptions?.show?.resource ?? [],
  operations: property.displayOptions?.show?.operation ?? [],
});

const keyCounts = new Map();
const records = rawBundle.fields.map((property) => {
  const context = sourceContext(property);
  const resourcePart = context.resources.length ? context.resources.join('Or') : 'global';
  const operationPart = context.operations.length ? context.operations.join('Or') : 'all';
  const keyBase = resourcePart + pascal(operationPart) + pascal(property.name);
  const count = (keyCounts.get(keyBase) ?? 0) + 1;
  keyCounts.set(keyBase, count);
  return { property, context, key: count === 1 ? keyBase : keyBase + count };
});

const intersects = (left, right) =>
  !left.length || !right.length || left.some((value) => right.includes(value));

const findTopKey = (nativeName, owner) => {
  if (nativeName === 'resource') return 'resource';
  if (nativeName === 'operation') {
    return owner.context.resources.length === 1
      ? owner.context.resources[0] + 'Operation'
      : 'operation';
  }
  const candidates = records.filter((candidate) =>
    candidate.property.name === nativeName &&
    intersects(candidate.context.resources, owner.context.resources) &&
    intersects(candidate.context.operations, owner.context.operations));
  if (candidates.length === 1) return candidates[0].key;
  const exact = candidates.find((candidate) =>
    JSON.stringify(candidate.context.resources) === JSON.stringify(owner.context.resources) &&
    JSON.stringify(candidate.context.operations) === JSON.stringify(owner.context.operations));
  return exact?.key ?? candidates[0]?.key ?? nativeName;
};

const mapConditions = (conditions, owner, siblingRecords = []) => {
  if (!conditions) return undefined;
  const mapped = {};
  for (const [sourceKey, values] of Object.entries(conditions)) {
    const nativeName = sourceKey.replace(/^\//, '');
    let key;
    if (nativeName === 'resource') key = 'resource';
    else if (nativeName === 'operation') key = findTopKey('operation', owner);
    else {
      const siblings = siblingRecords.filter((record) => record.property.name === nativeName);
      key = siblings.length === 1 ? siblings[0].key : findTopKey(nativeName, owner);
    }
    mapped[key] = values;
  }
  return Object.keys(mapped).length ? mapped : undefined;
};

const sourceKindToCatalogKind = (property) => {
  if (property.type === 'string') return property.typeOptions?.rows ? 'textarea' : 'text';
  if (property.type === 'dateTime') return 'text';
  if (property.type === 'options') return 'select';
  if (property.type === 'multiOptions') return 'multiSelect';
  return property.type;
};

const fallbackValue = (property) => {
  if (property.default !== undefined) return property.default;
  if (property.type === 'collection' || property.type === 'fixedCollection') return {};
  if (property.type === 'multiOptions') return [];
  if (property.type === 'boolean') return false;
  if (property.type === 'number') return 0;
  return '';
};

const normalizeChildren = (properties, owner) => {
  const counts = new Map();
  const siblingRecords = (properties ?? []).map((property) => {
    const base = property.name || 'field';
    const count = (counts.get(base) ?? 0) + 1;
    counts.set(base, count);
    return { property, context: owner.context, key: count === 1 ? base : base + count };
  });
  return siblingRecords.map((record) => normalizeProperty(record, owner, siblingRecords));
};

const normalizeProperty = (record, owner = record, siblingRecords = []) => {
  const property = record.property;
  const sourceShow = property.displayOptions?.show;
  const sourceHide = property.displayOptions?.hide;
  const normalized = {
    key: record.key,
    n8nKey: property.name,
    label: property.displayName || property.name,
    kind: sourceKindToCatalogKind(property),
    sourceKind: property.type,
    value: fallbackValue(property),
    required: property.required === true,
  };

  if (property.default !== undefined) normalized.sourceDefault = property.default;
  if (property.description) normalized.description = property.description;
  if (property.placeholder) normalized.placeholder = property.placeholder;
  if (property.hint) normalized.hint = property.hint;
  if (property.noDataExpression) normalized.noDataExpression = true;
  if (property.typeOptions?.rows) normalized.rows = property.typeOptions.rows;
  if (property.typeOptions?.minValue !== undefined) normalized.min = property.typeOptions.minValue;
  if (property.typeOptions?.maxValue !== undefined) normalized.max = property.typeOptions.maxValue;
  if (property.typeOptions?.numberPrecision !== undefined) normalized.precision = property.typeOptions.numberPrecision;
  if (property.typeOptions?.password) normalized.password = true;

  const showWhen = mapConditions(sourceShow, owner, siblingRecords);
  const hideWhen = mapConditions(sourceHide, owner, siblingRecords);
  if (showWhen) normalized.showWhen = showWhen;
  if (hideWhen) normalized.hideWhen = hideWhen;
  if (sourceShow) normalized.n8nShowWhen = sourceShow;
  if (sourceHide) normalized.n8nHideWhen = sourceHide;

  if (property.type === 'options' || property.type === 'multiOptions') {
    normalized.options = (property.options ?? []).map((entry) => ({
      label: entry.name,
      value: entry.value,
      ...(entry.description ? { description: entry.description } : {}),
      ...(entry.action ? { action: entry.action } : {}),
    }));
    if (property.typeOptions?.loadOptionsMethod) {
      normalized.locked = true;
      normalized.dynamic = true;
      normalized.loadOptionsMethod = property.typeOptions.loadOptionsMethod;
      normalized.loadOptionsDependsOn = property.typeOptions.loadOptionsDependsOn ?? [];
      normalized.simulationNote = lockedLookupNote;
    }
  }

  if (property.type === 'collection') {
    normalized.addLabel = property.placeholder ?? 'Add Option';
    normalized.fields = normalizeChildren(property.options, owner);
  }

  if (property.type === 'fixedCollection') {
    const groups = property.options ?? [];
    const group = groups[0] ?? {};
    normalized.collectionKey = group.name ?? 'values';
    normalized.collectionLabel = group.displayName ?? 'Values';
    normalized.addLabel = property.placeholder ?? property.typeOptions?.multipleValueButtonText ?? 'Add Item';
    normalized.multiple = property.typeOptions?.multipleValues === true;
    normalized.sortable = property.typeOptions?.sortable === true;
    normalized.fields = normalizeChildren(group.values, owner);
    if (groups.length > 1) {
      normalized.groups = groups.map((entry) => ({
        key: entry.name,
        label: entry.displayName,
        fields: normalizeChildren(entry.values, owner),
      }));
    }
  }

  if (property.type === 'dateTime') {
    normalized.simulationNote = 'Date and time remains inert authoring text and is never parsed or converted to an epoch.';
  }

  return normalized;
};

const operationOptions = Object.fromEntries(
  Object.entries(rawBundle.operations).map(([resource, property]) => [
    resource,
    property.options.map((entry) => ({
      label: entry.name,
      value: entry.value,
      ...(entry.description ? { description: entry.description } : {}),
      ...(entry.action ? { action: entry.action } : {}),
    })),
  ]),
);

const resources = resourceOrder.map((resource) => ({
  value: resource,
  defaultOperation: rawBundle.operations[resource].default,
  operations: operationOptions[resource].map(({ value }) => value),
}));

const operationFields = resourceOrder.map((resource) => ({
  key: resource + 'Operation',
  n8nKey: 'operation',
  label: 'Operation',
  kind: 'select',
  sourceKind: 'options',
  value: rawBundle.operations[resource].default,
  sourceDefault: rawBundle.operations[resource].default,
  required: false,
  noDataExpression: true,
  options: operationOptions[resource],
  showWhen: { resource: [resource] },
  n8nShowWhen: { resource: [resource] },
}));

const resourceFields = records.map((record) => normalizeProperty(record));

const credentialFields = [
  {
    key: 'stripeSecretKey', n8nKey: 'secretKey', label: 'Secret Key',
    kind: 'text', sourceKind: 'string', value: '', required: false, password: true,
  },
  {
    key: 'stripeSignatureSecret', n8nKey: 'signatureSecret', label: 'Signature Secret',
    kind: 'text', sourceKind: 'string', value: '', required: false, password: true,
    description: 'The signature secret is used to verify the authenticity of requests sent by Stripe.',
  },
  {
    key: 'stripeSignatureNotice', n8nKey: 'notice',
    label: 'We strongly recommend setting up a <a href="https://stripe.com/docs/webhooks" target="_blank">signing secret</a> to ensure the authenticity of requests.',
    kind: 'notice', sourceKind: 'notice', value: '', required: false,
    showWhen: { stripeSignatureSecret: [''] }, n8nShowWhen: { signatureSecret: [''] },
  },
];

const params = [
  {
    key: 'stripeApiCredential',
    n8nKey: 'credentials.stripeApi',
    label: 'Credential to connect with',
    kind: 'select',
    sourceKind: 'credentials',
    value: 'stripeApi',
    required: true,
    locked: true,
    dynamic: true,
    options: [{ label: 'Stripe API', value: 'stripeApi' }],
    simulationNote: lockedCredentialNote,
  },
  {
    key: 'resource',
    n8nKey: 'resource',
    label: 'Resource',
    kind: 'select',
    sourceKind: 'options',
    value: 'balance',
    sourceDefault: 'balance',
    required: false,
    noDataExpression: true,
    options: resourceOrder.map((value) => ({ label: resourceLabels[value], value })),
  },
  ...operationFields,
  ...resourceFields,
];

const stripe = {
  type: 'stripe',
  n8nType: 'n8n-nodes-base.stripe',
  n8nVersion: 1,
  defaultVersion: 1,
  versionHistory: [1],
  currentSchemaVersions: [1],
  label: 'Stripe',
  defaultName: 'Stripe',
  subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
  description: 'Consume the Stripe API',
  category: 'action',
  categories: ['Finance & Accounting', 'Sales'],
  subcategories: [],
  group: ['transform'],
  defaults: { name: 'Stripe' },
  inputs: ['main'],
  outputs: ['main'],
  usableAsTool: true,
  icon: '/node-icons/stripe.svg',
  n8nIcon: 'file:stripe.svg',
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { width: 360, height: 360, viewBox: '54 -80 360 360' },
  iconAssetSha256: 'fa5ad6b9dfcf59dd44e7c614432ebd0310f26938f9e6b451df20996f9dadd3ba',
  sourceIconAssetSha256: 'fa5ad6b9dfcf59dd44e7c614432ebd0310f26938f9e6b451df20996f9dadd3ba',
  aliases: [],
  docs: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.stripe/',
  docsByResource: Object.fromEntries(
    resourceOrder.map((resource) => [
      resource,
      'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.stripe/',
    ]),
  ),
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/stripe/',
  source: {
    commit: sourceCommit,
    path: 'packages/nodes-base/nodes/Stripe/Stripe.node.ts',
    metadataPath: 'packages/nodes-base/nodes/Stripe/Stripe.node.json',
    descriptionPaths: [
      'packages/nodes-base/nodes/Stripe/descriptions/BalanceDescription.ts',
      'packages/nodes-base/nodes/Stripe/descriptions/ChargeDescription.ts',
      'packages/nodes-base/nodes/Stripe/descriptions/CouponDescription.ts',
      'packages/nodes-base/nodes/Stripe/descriptions/CustomerDescription.ts',
      'packages/nodes-base/nodes/Stripe/descriptions/CustomerCardDescription.ts',
      'packages/nodes-base/nodes/Stripe/descriptions/MeterEventDescription.ts',
      'packages/nodes-base/nodes/Stripe/descriptions/SourceDescription.ts',
      'packages/nodes-base/nodes/Stripe/descriptions/TokenDescription.ts',
    ],
    helperPath: 'packages/nodes-base/nodes/Stripe/helpers.ts',
    credentialPath: 'packages/nodes-base/credentials/StripeApi.credentials.ts',
    iconPath: 'packages/nodes-base/nodes/Stripe/stripe.svg',
    sourcePropertyCount: rawBundle.sourcePropertyCount,
    sourceActionFieldCount: rawBundle.fields.length,
    sourceTreeFieldCount: rawBundle.sourceTreeFieldCount,
    sourceOperationFieldCount: Object.keys(rawBundle.operations).length,
  },
  resources,
  credentialRequirements: [
    {
      type: 'stripeApi',
      name: 'Stripe API',
      required: true,
      inert: true,
      documentationUrl: 'stripe',
      authentication: {
        sourceType: 'generic',
        sourceHeader: 'Authorization: Bearer {{$credentials.secretKey}}',
        applied: false,
      },
      testRequest: {
        method: 'GET',
        baseURL: 'https://api.stripe.com/v1',
        url: '/charges',
        executed: false,
      },
      fields: credentialFields,
    },
  ],
  credentialUiMetadata: [
    {
      key: 'stripeApiCredential',
      type: 'stripeApi',
      name: 'Stripe API',
      sourcePath: 'packages/nodes-base/credentials/StripeApi.credentials.ts',
      renderedInCredentialEditor: false,
      inert: true,
    },
  ],
  params,
  resourceOperationParity: Object.fromEntries(
    resources.map((resource) => [
      resource.value,
      {
        expected: resource.operations,
        represented: operationOptions[resource.value].map(({ value }) => value),
        default: resource.defaultOperation,
      },
    ]),
  ),
  operationCount: resources.reduce((total, resource) => total + resource.operations.length, 0),
  docsSummary: {
    sourceOfTruth: 'Pinned implementation; the official n8n Stripe page is supplementary.',
    documentedAuthenticationMethods: ['stripeApi'],
    aiToolDocumented: true,
  },
  lookupMetadata: {
    getCurrencies: {
      parameters: ['currency'],
      source: 'Stripe country_specs supported_payment_currencies',
      networkAccess: false,
    },
    getCustomers: {
      parameters: [],
      source: 'Stripe customer loader retained by the live node but unused by current visible properties',
      networkAccess: false,
      representedInCurrentParams: false,
    },
  },
  versionBranches: [
    { versions: '1', implementation: 'Stripe', representedInCurrentParams: true },
  ],
  platformGaps: [
    'The native schema reuses operation, customerId, chargeId, sourceId, currency, amount, returnAll, limit, metadata, address, shipping, and other names across conditional branches. Context-derived UI keys keep every current branch unique while n8nKey records the native name.',
    'Three Currency fields normally call getCurrencies, which requests Stripe country specifications. The method name is retained, but each list is locked and empty.',
    'The live node also defines getCustomers, but no current visible property references it. It remains provenance metadata and is not exposed as an invented lookup control.',
    'The Stripe API credential, bearer header, and credential-test request are metadata only. Secret Key and Signature Secret never leave inert credential metadata.',
    'Signature Secret and its notice belong to the shared Stripe credential type used by the trigger. They are retained as credential-schema metadata only; no trigger, webhook, or signature verification behavior is included.',
    'Meter Event Timestamp uses a native dateTime control. It is normalized to inert text and is never parsed or converted.',
    'Card numbers, CVCs, card tokens, and Stripe IDs are authoring text only. They are never validated, tokenized, logged, transmitted, or executed.',
    'The source marks Stripe usableAsTool. This is capability metadata only; no executable AI Tool connector is added.',
  ],
  unsupportedVisibleTypes: [
    {
      n8nKey: 'credentials.stripeApi',
      sourceType: 'credentials',
      normalizedKind: 'locked select',
      reason: 'Credential discovery and editors are unavailable.',
    },
    {
      n8nKey: 'currency',
      sourceType: 'options with loadOptionsMethod',
      normalizedKind: 'locked select',
      reason: 'Remote Stripe currency lookup is disabled.',
    },
    {
      n8nKey: 'timestamp',
      sourceType: 'dateTime',
      normalizedKind: 'text',
      reason: 'Dates remain inert text and are never interpreted.',
    },
  ],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    credentialCreation: false,
    credentialTesting: false,
    authentication: false,
    secretHandling: false,
    signatureVerification: false,
    apiRequests: false,
    networkAccess: false,
    expressionEvaluation: false,
    dynamicCurrencyLookup: false,
    balanceRead: false,
    chargeRead: false,
    chargeMutation: false,
    couponRead: false,
    couponMutation: false,
    customerRead: false,
    customerMutation: false,
    customerCardRead: false,
    customerCardMutation: false,
    meterEventMutation: false,
    sourceRead: false,
    sourceMutation: false,
    tokenCreation: false,
    cardDataProcessing: false,
    dateParsing: false,
    webhookHandling: false,
    triggerHandling: false,
    textToSpeech: false,
    voice: false,
  },
  output: {},
};

export default stripe;

