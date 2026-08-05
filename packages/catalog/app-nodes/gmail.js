// Editor-only descriptor for n8n's current Gmail v2.2 action node.
// The pinned static property definitions are normalized at module load. Email,
// credentials, lookups, attachments, webhooks, waiting, and APIs remain inert.

const sourceCommit = '3d68c29b9281f14097aa9f15e01ac0777e538b11';
const currentVersion = 2.2;
const lockedCredentialNote =
  'This selector is locked. The simulation never creates, reads, tests, refreshes, or applies Google credentials.';
const lockedLookupNote =
  'This list normally loads through Gmail using the selected credential. It is intentionally locked and empty.';

const rawBundle = {"operations":{"draft":{"displayName":"Operation","name":"operation","type":"options","noDataExpression":true,"displayOptions":{"show":{"resource":["draft"]}},"options":[{"name":"Create","value":"create","action":"Create a draft"},{"name":"Delete","value":"delete","action":"Delete a draft"},{"name":"Get","value":"get","action":"Get a draft"},{"name":"Get Many","value":"getAll","action":"Get many drafts"}],"default":"create"},"label":{"displayName":"Operation","name":"operation","type":"options","noDataExpression":true,"displayOptions":{"show":{"resource":["label"]}},"options":[{"name":"Create","value":"create","action":"Create a label"},{"name":"Delete","value":"delete","action":"Delete a label"},{"name":"Get","value":"get","action":"Get a label info"},{"name":"Get Many","value":"getAll","action":"Get many labels"}],"default":"getAll"},"message":{"displayName":"Operation","name":"operation","type":"options","noDataExpression":true,"displayOptions":{"show":{"resource":["message"]}},"options":[{"name":"Add Label","value":"addLabels","action":"Add label to message"},{"name":"Delete","value":"delete","action":"Delete a message"},{"name":"Get","value":"get","action":"Get a message"},{"name":"Get Many","value":"getAll","action":"Get many messages"},{"name":"Mark as Read","value":"markAsRead","action":"Mark a message as read"},{"name":"Mark as Unread","value":"markAsUnread","action":"Mark a message as unread"},{"name":"Remove Label","value":"removeLabels","action":"Remove label from message"},{"name":"Reply","value":"reply","action":"Reply to a message"},{"name":"Send","value":"send","action":"Send a message"},{"name":"Send and Wait for Response","value":"sendAndWait","action":"Send message and wait for response"}],"default":"send"},"thread":{"displayName":"Operation","name":"operation","type":"options","noDataExpression":true,"displayOptions":{"show":{"resource":["thread"]}},"options":[{"name":"Add Label","value":"addLabels","action":"Add label to thread"},{"name":"Delete","value":"delete","action":"Delete a thread"},{"name":"Get","value":"get","action":"Get a thread"},{"name":"Get Many","value":"getAll","action":"Get many threads"},{"name":"Remove Label","value":"removeLabels","action":"Remove label from thread"},{"name":"Reply","value":"reply","action":"Reply to a message"},{"name":"Trash","value":"trash","action":"Trash a thread"},{"name":"Untrash","value":"untrash","action":"Untrash a thread"}],"default":"getAll"}},"fields":[{"displayName":"Draft ID","name":"messageId","type":"string","default":"","required":true,"displayOptions":{"show":{"resource":["draft"],"operation":["delete","get"]}},"placeholder":"r-3254521568507167962"},{"displayName":"Subject","name":"subject","type":"string","default":"","required":true,"displayOptions":{"show":{"resource":["draft"],"operation":["create"]}},"placeholder":"Hello World!"},{"displayName":"To reply to an existing thread, specify the Thread ID from the options below.","name":"threadNotice","type":"notice","default":"","displayOptions":{"show":{"resource":["draft"],"operation":["create"]}}},{"displayName":"Email Type","name":"emailType","type":"options","default":"text","required":true,"noDataExpression":true,"options":[{"name":"HTML","value":"html"},{"name":"Text","value":"text"}],"displayOptions":{"show":{"resource":["draft"],"operation":["create"]}}},{"displayName":"Message","name":"message","type":"string","default":"","required":true,"displayOptions":{"show":{"resource":["draft"],"operation":["create"]}}},{"displayName":"Options","name":"options","type":"collection","placeholder":"Add option","displayOptions":{"show":{"resource":["draft"],"operation":["create"]}},"default":{},"options":[{"displayName":"Attachments","name":"attachmentsUi","placeholder":"Add Attachment","type":"fixedCollection","typeOptions":{"multipleValues":true},"options":[{"name":"attachmentsBinary","displayName":"Attachment Binary","values":[{"displayName":"Attachment Field Name (in Input)","name":"property","type":"string","default":"","description":"Add the field name from the input node. Multiple properties can be set separated by comma."}]}],"default":{},"description":"Array of supported attachments to add to the message"},{"displayName":"BCC","name":"bccList","type":"string","description":"The email addresses of the blind copy recipients. Multiple addresses can be separated by a comma. e.g. jay@getsby.com, jon@smith.com.","placeholder":"info@example.com","default":""},{"displayName":"CC","name":"ccList","type":"string","description":"The email addresses of the copy recipients. Multiple addresses can be separated by a comma. e.g. jay@getsby.com, jon@smith.com.","placeholder":"info@example.com","default":""},{"displayName":"From Alias Name or ID","name":"fromAlias","type":"options","default":"","description":"Select the alias to send the email from. Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code/expressions/\">expression</a>.","typeOptions":{"loadOptionsMethod":"getGmailAliases"}},{"displayName":"Send Replies To","name":"replyTo","type":"string","placeholder":"reply@example.com","default":"","description":"The email address that the reply message is sent to"},{"displayName":"Thread ID","name":"threadId","type":"string","placeholder":"18cc573e2431878f","default":"","description":"The identifier of the thread to attach the draft"},{"displayName":"To Email","name":"sendTo","type":"string","default":"","placeholder":"info@example.com","description":"The email addresses of the recipients. Multiple addresses can be separated by a comma. e.g. jay@getsby.com, jon@smith.com."}]},{"displayName":"Options","name":"options","type":"collection","placeholder":"Add option","displayOptions":{"show":{"resource":["draft"],"operation":["get"]}},"default":{},"options":[{"displayName":"Attachment Prefix","name":"dataPropertyAttachmentsPrefixName","type":"string","default":"attachment_","description":"Prefix for name of the binary property to which to write the attachment. An index starting with 0 will be added. So if name is 'attachment_' the first attachment is saved to 'attachment_0'."},{"displayName":"Download Attachments","name":"downloadAttachments","type":"boolean","default":false,"description":"Whether the draft's attachments will be downloaded"}]},{"displayName":"Return All","name":"returnAll","type":"boolean","displayOptions":{"show":{"operation":["getAll"],"resource":["draft"]}},"default":false,"description":"Whether to return all results or only up to a given limit"},{"displayName":"Limit","name":"limit","type":"number","displayOptions":{"show":{"operation":["getAll"],"resource":["draft"],"returnAll":[false]}},"typeOptions":{"minValue":1,"maxValue":500},"default":50,"description":"Max number of results to return"},{"displayName":"Options","name":"options","type":"collection","placeholder":"Add option","default":{},"displayOptions":{"show":{"operation":["getAll"],"resource":["draft"]}},"options":[{"displayName":"Attachment Prefix","name":"dataPropertyAttachmentsPrefixName","type":"string","default":"attachment_","description":"Prefix for name of the binary property to which to write the attachments. An index starting with 0 will be added. So if name is 'attachment_' the first attachment is saved to 'attachment_0'."},{"displayName":"Download Attachments","name":"downloadAttachments","type":"boolean","default":false,"description":"Whether the draft's attachments will be downloaded"},{"displayName":"Include Spam and Trash","name":"includeSpamTrash","type":"boolean","default":false,"description":"Whether to include messages from SPAM and TRASH in the results"}]},{"displayName":"Name","name":"name","type":"string","default":"","required":true,"displayOptions":{"show":{"resource":["label"],"operation":["create"]}},"placeholder":"invoices","description":"Label Name"},{"displayName":"Label ID","name":"labelId","type":"string","default":"","required":true,"displayOptions":{"show":{"resource":["label"],"operation":["get","delete"]}},"description":"The ID of the label"},{"displayName":"Options","name":"options","type":"collection","placeholder":"Add option","displayOptions":{"show":{"resource":["label"],"operation":["create"]}},"default":{},"options":[{"displayName":"Label List Visibility","name":"labelListVisibility","type":"options","options":[{"name":"Hide","value":"labelHide"},{"name":"Show","value":"labelShow"},{"name":"Show If Unread","value":"labelShowIfUnread"}],"default":"labelShow","description":"The visibility of the label in the label list in the Gmail web interface"},{"displayName":"Message List Visibility","name":"messageListVisibility","type":"options","options":[{"name":"Hide","value":"hide"},{"name":"Show","value":"show"}],"default":"show","description":"The visibility of messages with this label in the message list in the Gmail web interface"}]},{"displayName":"Return All","name":"returnAll","type":"boolean","displayOptions":{"show":{"operation":["getAll"],"resource":["label"]}},"default":false,"description":"Whether to return all results or only up to a given limit"},{"displayName":"Limit","name":"limit","type":"number","displayOptions":{"show":{"operation":["getAll"],"resource":["label"],"returnAll":[false]}},"typeOptions":{"minValue":1,"maxValue":500},"default":50,"description":"Max number of results to return"},{"displayName":"Message ID","name":"messageId","type":"string","default":"","required":true,"displayOptions":{"show":{"resource":["message"],"operation":["get","delete","markAsRead","markAsUnread"]}},"placeholder":"172ce2c4a72cc243"},{"displayName":"Message ID","name":"messageId","type":"string","default":"","required":true,"displayOptions":{"show":{"resource":["message"],"operation":["reply"]}},"placeholder":"172ce2c4a72cc243"},{"displayName":"To","name":"sendTo","type":"string","default":"","required":true,"displayOptions":{"show":{"resource":["message"],"operation":["send"]}},"placeholder":"info@example.com","description":"The email addresses of the recipients. Multiple addresses can be separated by a comma. e.g. jay@getsby.com, jon@smith.com."},{"displayName":"Subject","name":"subject","type":"string","default":"","required":true,"displayOptions":{"show":{"resource":["message"],"operation":["send"]}},"placeholder":"Hello World!"},{"displayName":"Email Type","name":"emailType","type":"options","default":"html","required":true,"noDataExpression":true,"options":[{"name":"Text","value":"text"},{"name":"HTML","value":"html"}],"displayOptions":{"show":{"resource":["message"],"operation":["send","reply"]},"hide":{"@version":[2]}}},{"displayName":"Email Type","name":"emailType","type":"options","default":"html","required":true,"noDataExpression":true,"options":[{"name":"Text","value":"text"},{"name":"HTML","value":"html"}],"displayOptions":{"show":{"resource":["message"],"operation":["send","reply"],"@version":[2]}}},{"displayName":"Message","name":"message","type":"string","default":"","required":true,"displayOptions":{"show":{"resource":["message"],"operation":["reply","send"]}}},{"displayName":"Options","name":"options","type":"collection","placeholder":"Add option","displayOptions":{"show":{"resource":["message"],"operation":["send","reply"]}},"default":{},"options":[{"displayName":"Append n8n Attribution","name":"appendAttribution","type":"boolean","default":true,"description":"Whether to include the phrase “This email was sent automatically with n8n” to the end of the email"},{"displayName":"Attachments","name":"attachmentsUi","placeholder":"Add Attachment","type":"fixedCollection","typeOptions":{"multipleValues":true},"options":[{"name":"attachmentsBinary","displayName":"Attachment Binary","values":[{"displayName":"Attachment Field Name","name":"property","type":"string","default":"data","description":"Add the field name from the input node. Multiple properties can be set separated by comma.","hint":"The name of the field with the attachment in the node input"}]}],"default":{},"description":"Array of supported attachments to add to the message"},{"displayName":"BCC","name":"bccList","type":"string","description":"The email addresses of the blind copy recipients. Multiple addresses can be separated by a comma. e.g. jay@getsby.com, jon@smith.com.","placeholder":"info@example.com","default":""},{"displayName":"CC","name":"ccList","type":"string","description":"The email addresses of the copy recipients. Multiple addresses can be separated by a comma. e.g. jay@getsby.com, jon@smith.com.","placeholder":"info@example.com","default":""},{"displayName":"Sender Name","name":"senderName","type":"string","placeholder":"e.g. Nathan","default":"","description":"The name that will be shown in recipients' inboxes"},{"displayName":"Send Replies To","name":"replyTo","type":"string","placeholder":"reply@example.com","default":"","description":"The email address that the reply message is sent to","displayOptions":{"hide":{"/operation":["reply"]}}},{"displayName":"Reply to Sender Only","name":"replyToSenderOnly","type":"boolean","default":false,"description":"Whether to reply to the sender only or to the entire list of recipients"}]},{"displayName":"Simplify","name":"simple","type":"boolean","displayOptions":{"show":{"operation":["get"],"resource":["message"]}},"default":true,"description":"Whether to return a simplified version of the response instead of the raw data","builderHint":{"propertyHint":"Keep true by default. When true, returns lightweight metadata (labels, subject, from, to, snippet). When false, fetches and parses the full raw email (adds html, text, textAsHtml, headers, attachments), which uses much more memory and is a common cause of out-of-memory crashes. Only set false when the email body is actually required, e.g. for AI classification, summarization, or content processing."}},{"displayName":"Simplify already returns the key fields most workflows need. The full response is much larger and can cause out-of-memory errors. Only turn Simplify off if you need the raw email body, attachments or other fields not available in the simplified response.","name":"simplifyMemoryNotice","type":"notice","default":"","displayOptions":{"show":{"operation":["get"],"resource":["message"],"simple":[false]}}},{"displayName":"Options","name":"options","type":"collection","placeholder":"Add option","displayOptions":{"show":{"resource":["message"],"operation":["get"]},"hide":{"simple":[true]}},"default":{},"options":[{"displayName":"Attachment Prefix","name":"dataPropertyAttachmentsPrefixName","type":"string","default":"attachment_","description":"Prefix for name of the binary property to which to write the attachment. An index starting with 0 will be added. So if name is 'attachment_' the first attachment is saved to 'attachment_0'."},{"displayName":"Download Attachments","name":"downloadAttachments","type":"boolean","default":false,"description":"Whether the email's attachments will be downloaded and included in the output"}]},{"displayName":"Return All","name":"returnAll","type":"boolean","displayOptions":{"show":{"operation":["getAll"],"resource":["message"]}},"default":false,"description":"Whether to return all results or only up to a given limit"},{"displayName":"Limit","name":"limit","type":"number","displayOptions":{"show":{"operation":["getAll"],"resource":["message"],"returnAll":[false]}},"typeOptions":{"minValue":1,"maxValue":500},"default":50,"description":"Max number of results to return"},{"displayName":"Simplify","name":"simple","type":"boolean","displayOptions":{"show":{"operation":["getAll"],"resource":["message"]}},"default":true,"description":"Whether to return a simplified version of the response instead of the raw data","builderHint":{"propertyHint":"Keep true by default. When true, returns lightweight metadata (labels, subject, from, to, snippet) per message. When false, fetches and parses the full raw email for every message (adds html, text, textAsHtml, headers, attachments), which uses much more memory and is a common cause of out-of-memory crashes. Only set false when the email body is actually required, e.g. for AI classification, summarization, or content processing."}},{"displayName":"Simplify already returns the key fields most workflows need. The full response is much larger and can cause out-of-memory errors. Only turn Simplify off if you need the raw email body, attachments or other fields not available in the simplified response.","name":"simplifyMemoryNotice","type":"notice","default":"","displayOptions":{"show":{"operation":["getAll"],"resource":["message"],"simple":[false]}}},{"displayName":"Fetching a lot of messages may take a long time. Consider using filters to speed things up","name":"filtersNotice","type":"notice","default":"","displayOptions":{"show":{"operation":["getAll"],"resource":["message"],"returnAll":[true]}}},{"displayName":"Filters","name":"filters","type":"collection","placeholder":"Add Filter","default":{},"displayOptions":{"show":{"operation":["getAll"],"resource":["message"]}},"options":[{"displayName":"Include Spam and Trash","name":"includeSpamTrash","type":"boolean","default":false,"description":"Whether to include messages from SPAM and TRASH in the results"},{"displayName":"Label Names or IDs","name":"labelIds","type":"multiOptions","typeOptions":{"loadOptionsMethod":"getLabels"},"default":[],"description":"Only return messages with labels that match all of the specified label IDs. Choose from the list, or specify IDs using an <a href=\"https://docs.n8n.io/code/expressions/\">expression</a>."},{"displayName":"Search","name":"q","type":"string","default":"","placeholder":"has:attachment","hint":"Use the same format as in the Gmail search box. <a href=\"https://support.google.com/mail/answer/7190?hl=en\">More info</a>.","description":"Only return messages matching the specified query"},{"displayName":"Read Status","name":"readStatus","type":"options","default":"unread","hint":"Filter emails by whether they have been read or not","options":[{"name":"Unread and read emails","value":"both"},{"name":"Unread emails only","value":"unread"},{"name":"Read emails only","value":"read"}]},{"displayName":"Received After","name":"receivedAfter","type":"dateTime","default":"","description":"Get all emails received after the specified date. In an expression you can set date using string in ISO format or a timestamp in miliseconds."},{"displayName":"Received Before","name":"receivedBefore","type":"dateTime","default":"","description":"Get all emails received before the specified date. In an expression you can set date using string in ISO format or a timestamp in miliseconds."},{"displayName":"Sender","name":"sender","type":"string","default":"","description":"Sender name or email to filter by","hint":"Enter an email or part of a sender name"}]},{"displayName":"Options","name":"options","type":"collection","placeholder":"Add option","default":{},"displayOptions":{"show":{"operation":["getAll"],"resource":["message"]},"hide":{"simple":[true]}},"options":[{"displayName":"Attachment Prefix","name":"dataPropertyAttachmentsPrefixName","type":"string","default":"attachment_","description":"Prefix for name of the binary property to which to write the attachment. An index starting with 0 will be added. So if name is 'attachment_' the first attachment is saved to 'attachment_0'."},{"displayName":"Download Attachments","name":"downloadAttachments","type":"boolean","default":false,"description":"Whether the email's attachments will be downloaded and included in the output"}]},{"displayName":"Message ID","name":"messageId","type":"string","default":"","required":true,"placeholder":"172ce2c4a72cc243","displayOptions":{"show":{"resource":["message"],"operation":["addLabels","removeLabels"]}}},{"displayName":"Label Names or IDs","name":"labelIds","type":"multiOptions","typeOptions":{"loadOptionsMethod":"getLabels"},"default":[],"required":true,"displayOptions":{"show":{"resource":["message"],"operation":["addLabels","removeLabels"]}},"description":"Choose from the list, or specify IDs using an <a href=\"https://docs.n8n.io/code/expressions/\">expression</a>"},{"displayName":"To","name":"sendTo","type":"string","default":"","required":true,"placeholder":"e.g. info@example.com","displayOptions":{"show":{"resource":["message"],"operation":["sendAndWait"]},"hide":{}}},{"displayName":"Subject","name":"subject","type":"string","default":"","required":true,"placeholder":"e.g. Approval required","displayOptions":{"show":{"resource":["message"],"operation":["sendAndWait"]},"hide":{}}},{"displayName":"Message","name":"message","type":"string","default":"","required":true,"typeOptions":{"rows":4},"displayOptions":{"show":{"resource":["message"],"operation":["sendAndWait"]},"hide":{}}},{"displayName":"Response Type","name":"responseType","type":"options","default":"approval","options":[{"name":"Approval","value":"approval","description":"User can approve/disapprove from within the message"},{"name":"Free Text","value":"freeText","description":"User can submit a response via a form"},{"name":"Custom Form","value":"customForm","description":"User can submit a response via a custom form"}],"displayOptions":{"show":{"resource":["message"],"operation":["sendAndWait"]},"hide":{}}},{"displayName":"Define Form","name":"defineForm","type":"options","noDataExpression":true,"options":[{"name":"Using Fields Below","value":"fields"},{"name":"Using JSON","value":"json"}],"default":"fields","displayOptions":{"show":{"resource":["message"],"operation":["sendAndWait"],"responseType":["customForm"]},"hide":{}}},{"displayName":"Form Fields","name":"jsonOutput","type":"json","typeOptions":{"rows":5},"default":"[\n  {\n    \"fieldLabel\": \"Name\",\n    \"placeholder\": \"enter your name\",\n    \"requiredField\": true\n  },\n  {\n    \"fieldLabel\": \"Age\",\n    \"fieldType\": \"number\",\n    \"placeholder\": \"enter your age\"\n  },\n  {\n    \"fieldLabel\": \"Email\",\n    \"fieldType\": \"email\",\n    \"requiredField\": true\n  },\n  {\n    \"fieldLabel\": \"Textarea\",\n    \"fieldType\": \"textarea\"\n  },\n  {\n    \"fieldLabel\": \"Dropdown Options\",\n    \"fieldType\": \"dropdown\",\n    \"fieldOptions\": {\n      \"values\": [\n        {\n          \"option\": \"option 1\"\n        },\n        {\n          \"option\": \"option 2\"\n        }\n      ]\n    },\n    \"requiredField\": true\n  },\n  {\n    \"fieldLabel\": \"Checkboxes\",\n    \"fieldType\": \"checkbox\",\n    \"fieldOptions\": {\n      \"values\": [\n        {\n          \"option\": \"option 1\"\n        },\n        {\n          \"option\": \"option 2\"\n        }\n      ]\n    }\n  },\n  {\n    \"fieldLabel\": \"Radio\",\n    \"fieldType\": \"radio\",\n    \"fieldOptions\": {\n      \"values\": [\n        {\n          \"option\": \"option 1\"\n        },\n        {\n          \"option\": \"option 2\"\n        }\n      ]\n    }\n  },\n  {\n    \"fieldLabel\": \"Email\",\n    \"fieldType\": \"email\",\n    \"placeholder\": \"me@mail.con\"\n  },\n  {\n    \"fieldLabel\": \"File\",\n    \"fieldType\": \"file\",\n    \"multipleFiles\": true,\n    \"acceptFileTypes\": \".jpg, .png\"\n  },\n  {\n    \"fieldLabel\": \"Number\",\n    \"fieldType\": \"number\"\n  },\n  {\n    \"fieldLabel\": \"Password\",\n    \"fieldType\": \"password\"\n  }\n]\n","validateType":"form-fields","ignoreValidationDuringExecution":true,"hint":"<a href=\"https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.form/\" target=\"_blank\">See docs</a> for field syntax","displayOptions":{"show":{"resource":["message"],"operation":["sendAndWait"],"responseType":["customForm"],"defineForm":["json"]},"hide":{}}},{"displayName":"Form Elements","name":"formFields","placeholder":"Add Form Element","type":"fixedCollection","default":{},"typeOptions":{"multipleValues":true,"sortable":true,"fixedCollection":{"itemTitle":"={{ $collection.item.properties.find(p => p.name === \"fieldType\").options.find(o => o.value === $collection.item.value.fieldType).name }}"}},"options":[{"displayName":"Values","name":"values","values":[{"displayName":"Field Name","name":"fieldName","description":"The name of the field, used in input attributes and referenced by the workflow","required":true,"type":"string","default":"","displayOptions":{"hide":{"fieldType":["html"]},"show":{"@version":[2.4]}}},{"displayName":"Label","name":"fieldLabel","type":"string","default":"","placeholder":"e.g. What is your name?","description":"Label that appears above the input field","required":true,"displayOptions":{"hide":{"fieldType":["hiddenField","html"]},"show":{"@version":[{"_cnd":{"gte":2.4}}]}}},{"displayName":"Field Name","name":"fieldLabel","type":"string","default":"","placeholder":"e.g. What is your name?","description":"Label that appears above the input field","required":true,"displayOptions":{"hide":{"fieldType":["hiddenField","html"]},"show":{"@version":[{"_cnd":{"lt":2.4}}]}}},{"displayName":"Field Name","name":"fieldName","description":"The name of the field, used in input attributes and referenced by the workflow","type":"string","default":"","displayOptions":{"show":{"fieldType":["hiddenField"],"@version":[{"_cnd":{"lt":2.4}}]}}},{"displayName":"Element Type","name":"fieldType","type":"options","default":"text","description":"The type of field to add to the form","options":[{"name":"Checkboxes","value":"checkbox"},{"name":"Custom HTML","value":"html"},{"name":"Date","value":"date"},{"name":"Dropdown","value":"dropdown"},{"name":"Email","value":"email"},{"name":"File","value":"file"},{"name":"Hidden Field","value":"hiddenField"},{"name":"Number","value":"number"},{"name":"Password","value":"password"},{"name":"Radio Buttons","value":"radio"},{"name":"Text Input","value":"text"},{"name":"Textarea","value":"textarea"}],"required":true,"builderHint":{"propertyHint":"Valid values: text, number, email, textarea, dropdown, date, file, html, hiddenField, radio, checkbox, password. There is NO 'time' type — use fieldType: 'text' with placeholder 'e.g. 2:30 PM' for time-of-day inputs."}},{"displayName":"Element Name","name":"elementName","type":"string","default":"","placeholder":"e.g. content-section","description":"Optional field. It can be used to include the html in the output.","displayOptions":{"show":{"fieldType":["html"]}}},{"displayName":"Custom Field Name","name":"fieldName","description":"The name of the field, used in input attributes and referenced by the workflow","type":"string","default":"","displayOptions":{"hide":{"fieldType":["html"]},"show":{"@version":[{"_cnd":{"gte":2.5}}]}}},{"displayName":"Placeholder","name":"placeholder","description":"Sample text to display inside the field","type":"string","default":"","displayOptions":{"hide":{"fieldType":["dropdown","date","file","html","hiddenField","radio","checkbox"]}}},{"displayName":"Default Value","name":"defaultValue","description":"Default value that will be pre-filled in the form field","type":"string","default":"","displayOptions":{"show":{"fieldType":["text","number","email","textarea"]}}},{"displayName":"Default Value","name":"defaultValue","description":"Default date value that will be pre-filled in the form field (format: YYYY-MM-DD)","type":"dateTime","typeOptions":{"dateOnly":true},"default":"","displayOptions":{"show":{"fieldType":["date"]}}},{"displayName":"Default Value","name":"defaultValue","description":"Default value that will be pre-selected. Must match one of the option labels.","type":"string","default":"","displayOptions":{"show":{"fieldType":["dropdown","radio"]}}},{"displayName":"Default Value","name":"defaultValue","description":"Default value(s) that will be pre-selected. Must match one or multiple of the option labels. Separate multiple pre-selected options with a comma.","type":"string","default":"","displayOptions":{"show":{"fieldType":["checkbox"]}}},{"displayName":"Field Value","name":"fieldValue","description":"Input value can be set here or will be passed as a query parameter via Field Name if no value is set","type":"string","default":"","displayOptions":{"show":{"fieldType":["hiddenField"]}}},{"displayName":"Field Options","name":"fieldOptions","placeholder":"Add Field Option","description":"List of options that can be selected from the dropdown","type":"fixedCollection","default":{"values":[{"option":""}]},"required":true,"displayOptions":{"show":{"fieldType":["dropdown"]}},"typeOptions":{"multipleValues":true,"sortable":true},"options":[{"displayName":"Values","name":"values","values":[{"displayName":"Option","name":"option","type":"string","default":""}]}]},{"displayName":"Checkboxes","name":"fieldOptions","placeholder":"Add Checkbox","type":"fixedCollection","default":{"values":[{"option":""}]},"required":true,"displayOptions":{"show":{"fieldType":["checkbox"]}},"typeOptions":{"multipleValues":true,"sortable":true},"options":[{"displayName":"Values","name":"values","values":[{"displayName":"Checkbox Label","name":"option","type":"string","default":""}]}]},{"displayName":"Radio Buttons","name":"fieldOptions","placeholder":"Add Radio Button","type":"fixedCollection","default":{"values":[{"option":""}]},"required":true,"displayOptions":{"show":{"fieldType":["radio"]}},"typeOptions":{"multipleValues":true,"sortable":true},"options":[{"displayName":"Values","name":"values","values":[{"displayName":"Radio Button Label","name":"option","type":"string","default":""}]}]},{"displayName":"Multiple Choice is a legacy option, please use Checkboxes or Radio Buttons field type instead","name":"multiselectLegacyNotice","type":"notice","default":"","displayOptions":{"show":{"multiselect":[true],"fieldType":["dropdown"],"@version":[{"_cnd":{"lt":2.3}}]}}},{"displayName":"Multiple Choice","name":"multiselect","type":"boolean","default":false,"description":"Whether to allow the user to select multiple options from the dropdown list","displayOptions":{"show":{"fieldType":["dropdown"],"@version":[{"_cnd":{"lt":2.3}}]}}},{"displayName":"Limit Selection","name":"limitSelection","type":"options","default":"unlimited","options":[{"name":"Exact Number","value":"exact"},{"name":"Range","value":"range"},{"name":"Unlimited","value":"unlimited"}],"displayOptions":{"show":{"fieldType":["checkbox"]}}},{"displayName":"Number of Selections","name":"numberOfSelections","type":"number","default":1,"typeOptions":{"numberPrecision":0,"minValue":1,"showEvenWhenOptional":true},"displayOptions":{"show":{"fieldType":["checkbox"],"limitSelection":["exact"]}}},{"displayName":"Minimum Selections","name":"minSelections","type":"number","default":0,"typeOptions":{"numberPrecision":0,"minValue":0,"showEvenWhenOptional":true},"displayOptions":{"show":{"fieldType":["checkbox"],"limitSelection":["range"]}}},{"displayName":"Maximum Selections","name":"maxSelections","type":"number","default":1,"typeOptions":{"numberPrecision":0,"minValue":1,"showEvenWhenOptional":true},"displayOptions":{"show":{"fieldType":["checkbox"],"limitSelection":["range"]}}},{"displayName":"HTML","name":"html","typeOptions":{"editor":"htmlEditor"},"type":"string","noDataExpression":true,"default":"<!-- Your custom HTML here --->\n\n\n","description":"HTML elements to display on the form page","hint":"Does not accept <code>&lt;script&gt;</code>, <code>&lt;style&gt;</code> or <code>&lt;input&gt;</code> tags","displayOptions":{"show":{"fieldType":["html"]}}},{"displayName":"Multiple Files","name":"multipleFiles","type":"boolean","default":true,"description":"Whether to allow the user to select multiple files from the file input or just one","displayOptions":{"show":{"fieldType":["file"]}}},{"displayName":"Accepted File Types","name":"acceptFileTypes","type":"string","default":"","description":"Comma-separated list of allowed file extensions","hint":"Leave empty to allow all file types","placeholder":"e.g. .jpg, .png","displayOptions":{"show":{"fieldType":["file"]}}},{"displayName":"The displayed date is formatted based on the locale of the user's browser","name":"formatDate","type":"notice","default":"","displayOptions":{"show":{"fieldType":["date"]}}},{"displayName":"Required Field","name":"requiredField","type":"boolean","default":false,"description":"Whether to require the user to enter a value for this field before submitting the form","displayOptions":{"hide":{"fieldType":["html","hiddenField"]}}}]}],"displayOptions":{"show":{"resource":["message"],"operation":["sendAndWait"],"responseType":["customForm"],"@version":[{"_cnd":{"lt":2.5}}],"defineForm":["fields"]},"hide":{}}},{"displayName":"Form Elements","name":"formFields","placeholder":"Add Form Element","type":"fixedCollection","default":{},"typeOptions":{"multipleValues":true,"sortable":true,"hideOptionalFields":true,"addOptionalFieldButtonText":"Add Attributes","fixedCollection":{"itemTitle":"={{ $collection.item.properties.find(p => p.name === \"fieldType\").options.find(o => o.value === $collection.item.value.fieldType).name }}"}},"options":[{"displayName":"Values","name":"values","values":[{"displayName":"Field Name","name":"fieldName","description":"The name of the field, used in input attributes and referenced by the workflow","required":true,"type":"string","default":"","displayOptions":{"hide":{"fieldType":["html"]},"show":{"@version":[2.4]}}},{"displayName":"Label","name":"fieldLabel","type":"string","default":"","placeholder":"e.g. What is your name?","description":"Label that appears above the input field","required":true,"displayOptions":{"hide":{"fieldType":["hiddenField","html"]},"show":{"@version":[{"_cnd":{"gte":2.4}}]}}},{"displayName":"Field Name","name":"fieldLabel","type":"string","default":"","placeholder":"e.g. What is your name?","description":"Label that appears above the input field","required":true,"displayOptions":{"hide":{"fieldType":["hiddenField","html"]},"show":{"@version":[{"_cnd":{"lt":2.4}}]}}},{"displayName":"Field Name","name":"fieldName","description":"The name of the field, used in input attributes and referenced by the workflow","type":"string","default":"","displayOptions":{"show":{"fieldType":["hiddenField"],"@version":[{"_cnd":{"lt":2.4}}]}}},{"displayName":"Element Type","name":"fieldType","type":"options","default":"text","description":"The type of field to add to the form","options":[{"name":"Checkboxes","value":"checkbox"},{"name":"Custom HTML","value":"html"},{"name":"Date","value":"date"},{"name":"Dropdown","value":"dropdown"},{"name":"Email","value":"email"},{"name":"File","value":"file"},{"name":"Hidden Field","value":"hiddenField"},{"name":"Number","value":"number"},{"name":"Password","value":"password"},{"name":"Radio Buttons","value":"radio"},{"name":"Text Input","value":"text"},{"name":"Textarea","value":"textarea"}],"required":true,"builderHint":{"propertyHint":"Valid values: text, number, email, textarea, dropdown, date, file, html, hiddenField, radio, checkbox, password. There is NO 'time' type — use fieldType: 'text' with placeholder 'e.g. 2:30 PM' for time-of-day inputs."}},{"displayName":"Element Name","name":"elementName","type":"string","default":"","placeholder":"e.g. content-section","description":"Optional field. It can be used to include the html in the output.","displayOptions":{"show":{"fieldType":["html"]}}},{"displayName":"Custom Field Name","name":"fieldName","description":"The name of the field, used in input attributes and referenced by the workflow","type":"string","default":"","displayOptions":{"hide":{"fieldType":["html"]},"show":{"@version":[{"_cnd":{"gte":2.5}}]}}},{"displayName":"Placeholder","name":"placeholder","description":"Sample text to display inside the field","type":"string","default":"","displayOptions":{"hide":{"fieldType":["dropdown","date","file","html","hiddenField","radio","checkbox"]}}},{"displayName":"Default Value","name":"defaultValue","description":"Default value that will be pre-filled in the form field","type":"string","default":"","displayOptions":{"show":{"fieldType":["text","number","email","textarea"]}}},{"displayName":"Default Value","name":"defaultValue","description":"Default date value that will be pre-filled in the form field (format: YYYY-MM-DD)","type":"dateTime","typeOptions":{"dateOnly":true},"default":"","displayOptions":{"show":{"fieldType":["date"]}}},{"displayName":"Default Value","name":"defaultValue","description":"Default value that will be pre-selected. Must match one of the option labels.","type":"string","default":"","displayOptions":{"show":{"fieldType":["dropdown","radio"]}}},{"displayName":"Default Value","name":"defaultValue","description":"Default value(s) that will be pre-selected. Must match one or multiple of the option labels. Separate multiple pre-selected options with a comma.","type":"string","default":"","displayOptions":{"show":{"fieldType":["checkbox"]}}},{"displayName":"Field Value","name":"fieldValue","description":"Input value can be set here or will be passed as a query parameter via Field Name if no value is set","type":"string","default":"","displayOptions":{"show":{"fieldType":["hiddenField"]}}},{"displayName":"Field Options","name":"fieldOptions","placeholder":"Add Field Option","description":"List of options that can be selected from the dropdown","type":"fixedCollection","default":{"values":[{"option":""}]},"required":true,"displayOptions":{"show":{"fieldType":["dropdown"]}},"typeOptions":{"multipleValues":true,"sortable":true},"options":[{"displayName":"Values","name":"values","values":[{"displayName":"Option","name":"option","type":"string","default":""}]}]},{"displayName":"Checkboxes","name":"fieldOptions","placeholder":"Add Checkbox","type":"fixedCollection","default":{"values":[{"option":""}]},"required":true,"displayOptions":{"show":{"fieldType":["checkbox"]}},"typeOptions":{"multipleValues":true,"sortable":true},"options":[{"displayName":"Values","name":"values","values":[{"displayName":"Checkbox Label","name":"option","type":"string","default":""}]}]},{"displayName":"Radio Buttons","name":"fieldOptions","placeholder":"Add Radio Button","type":"fixedCollection","default":{"values":[{"option":""}]},"required":true,"displayOptions":{"show":{"fieldType":["radio"]}},"typeOptions":{"multipleValues":true,"sortable":true},"options":[{"displayName":"Values","name":"values","values":[{"displayName":"Radio Button Label","name":"option","type":"string","default":""}]}]},{"displayName":"Multiple Choice is a legacy option, please use Checkboxes or Radio Buttons field type instead","name":"multiselectLegacyNotice","type":"notice","default":"","displayOptions":{"show":{"multiselect":[true],"fieldType":["dropdown"],"@version":[{"_cnd":{"lt":2.3}}]}}},{"displayName":"Multiple Choice","name":"multiselect","type":"boolean","default":false,"description":"Whether to allow the user to select multiple options from the dropdown list","displayOptions":{"show":{"fieldType":["dropdown"],"@version":[{"_cnd":{"lt":2.3}}]}}},{"displayName":"Limit Selection","name":"limitSelection","type":"options","default":"unlimited","options":[{"name":"Exact Number","value":"exact"},{"name":"Range","value":"range"},{"name":"Unlimited","value":"unlimited"}],"displayOptions":{"show":{"fieldType":["checkbox"]}}},{"displayName":"Number of Selections","name":"numberOfSelections","type":"number","default":1,"typeOptions":{"numberPrecision":0,"minValue":1,"showEvenWhenOptional":true},"displayOptions":{"show":{"fieldType":["checkbox"],"limitSelection":["exact"]}}},{"displayName":"Minimum Selections","name":"minSelections","type":"number","default":0,"typeOptions":{"numberPrecision":0,"minValue":0,"showEvenWhenOptional":true},"displayOptions":{"show":{"fieldType":["checkbox"],"limitSelection":["range"]}}},{"displayName":"Maximum Selections","name":"maxSelections","type":"number","default":1,"typeOptions":{"numberPrecision":0,"minValue":1,"showEvenWhenOptional":true},"displayOptions":{"show":{"fieldType":["checkbox"],"limitSelection":["range"]}}},{"displayName":"HTML","name":"html","typeOptions":{"editor":"htmlEditor"},"type":"string","noDataExpression":true,"default":"<!-- Your custom HTML here --->\n\n\n","description":"HTML elements to display on the form page","hint":"Does not accept <code>&lt;script&gt;</code>, <code>&lt;style&gt;</code> or <code>&lt;input&gt;</code> tags","displayOptions":{"show":{"fieldType":["html"]}}},{"displayName":"Multiple Files","name":"multipleFiles","type":"boolean","default":true,"description":"Whether to allow the user to select multiple files from the file input or just one","displayOptions":{"show":{"fieldType":["file"]}}},{"displayName":"Accepted File Types","name":"acceptFileTypes","type":"string","default":"","description":"Comma-separated list of allowed file extensions","hint":"Leave empty to allow all file types","placeholder":"e.g. .jpg, .png","displayOptions":{"show":{"fieldType":["file"]}}},{"displayName":"The displayed date is formatted based on the locale of the user's browser","name":"formatDate","type":"notice","default":"","displayOptions":{"show":{"fieldType":["date"]}}},{"displayName":"Required Field","name":"requiredField","type":"boolean","default":false,"description":"Whether to require the user to enter a value for this field before submitting the form","displayOptions":{"hide":{"fieldType":["html","hiddenField"]}}}]}],"displayOptions":{"show":{"resource":["message"],"operation":["sendAndWait"],"responseType":["customForm"],"@version":[{"_cnd":{"gte":2.5}}],"defineForm":["fields"]},"hide":{}}},{"displayName":"Approval Options","name":"approvalOptions","type":"fixedCollection","placeholder":"Add option","default":{},"options":[{"displayName":"Values","name":"values","values":[{"displayName":"Type of Approval","name":"approvalType","type":"options","placeholder":"Add option","default":"single","options":[{"name":"Approve Only","value":"single"},{"name":"Approve and Disapprove","value":"double"}]},{"displayName":"Approve Button Label","name":"approveLabel","type":"string","default":"Approve","displayOptions":{"show":{"approvalType":["single","double"]}}},{"displayName":"Approve Button Style","name":"buttonApprovalStyle","type":"options","default":"primary","options":[{"name":"Primary","value":"primary"},{"name":"Secondary","value":"secondary"}],"displayOptions":{"show":{"approvalType":["single","double"]}}},{"displayName":"Disapprove Button Label","name":"disapproveLabel","type":"string","default":"Decline","displayOptions":{"show":{"approvalType":["double"]}}},{"displayName":"Disapprove Button Style","name":"buttonDisapprovalStyle","type":"options","default":"secondary","options":[{"name":"Primary","value":"primary"},{"name":"Secondary","value":"secondary"}],"displayOptions":{"show":{"approvalType":["double"]}}}]}],"displayOptions":{"show":{"resource":["message"],"operation":["sendAndWait"],"responseType":["approval"]},"hide":{}}},{"displayName":"Options","name":"options","type":"collection","placeholder":"Add option","default":{},"options":[{"displayName":"Limit Wait Time","name":"limitWaitTime","type":"fixedCollection","description":"Whether to limit the time this node should wait for a user response before execution resumes","default":{"values":{"limitType":"afterTimeInterval","resumeAmount":45,"resumeUnit":"minutes"}},"options":[{"displayName":"Values","name":"values","values":[{"displayName":"Limit Type","name":"limitType","type":"options","default":"afterTimeInterval","description":"Sets the condition for the execution to resume. Can be a specified date or after some time.","options":[{"name":"After Time Interval","description":"Waits for a certain amount of time","value":"afterTimeInterval"},{"name":"At Specified Time","description":"Waits until the set date and time to continue","value":"atSpecifiedTime"}]},{"displayName":"Amount","name":"resumeAmount","type":"number","displayOptions":{"show":{"limitType":["afterTimeInterval"]}},"typeOptions":{"minValue":0,"numberPrecision":2},"default":1,"description":"The time to wait"},{"displayName":"Unit","name":"resumeUnit","type":"options","displayOptions":{"show":{"limitType":["afterTimeInterval"]}},"options":[{"name":"Minutes","value":"minutes"},{"name":"Hours","value":"hours"},{"name":"Days","value":"days"}],"default":"hours","description":"Unit of the interval value"},{"displayName":"Max Date and Time","name":"maxDateAndTime","type":"dateTime","displayOptions":{"show":{"limitType":["atSpecifiedTime"]}},"default":"","description":"Continue execution after the specified date and time"}]}]},{"displayName":"Append n8n Attribution","name":"appendAttribution","type":"boolean","default":true,"description":"Whether to include the phrase \"This message was sent automatically with n8n\" to the end of the message"}],"displayOptions":{"show":{"resource":["message"],"operation":["sendAndWait"],"responseType":["approval"]},"hide":{}}},{"displayName":"Options","name":"options","type":"collection","placeholder":"Add option","default":{},"options":[{"displayName":"Message Button Label","name":"messageButtonLabel","type":"string","default":"Respond"},{"displayName":"Response Form Title","name":"responseFormTitle","description":"Title of the form that the user can access to provide their response","type":"string","default":""},{"displayName":"Response Form Description","name":"responseFormDescription","description":"Description of the form that the user can access to provide their response","type":"string","default":""},{"displayName":"Response Form Button Label","name":"responseFormButtonLabel","type":"string","default":"Submit"},{"displayName":"Response Form Custom Styling","name":"responseFormCustomCss","type":"string","typeOptions":{"rows":10,"editor":"cssEditor"},"default":":root {\n\t--font-family: 'Open Sans', sans-serif;\n\t--font-weight-normal: 400;\n\t--font-weight-bold: 600;\n\t--font-size-body: 12px;\n\t--font-size-label: 14px;\n\t--font-size-test-notice: 12px;\n\t--font-size-input: 14px;\n\t--font-size-header: 20px;\n\t--font-size-paragraph: 14px;\n\t--font-size-link: 12px;\n\t--font-size-error: 12px;\n\t--font-size-html-h1: 28px;\n\t--font-size-html-h2: 20px;\n\t--font-size-html-h3: 16px;\n\t--font-size-html-h4: 14px;\n\t--font-size-html-h5: 12px;\n\t--font-size-html-h6: 10px;\n\t--font-size-subheader: 14px;\n\n\t/* Colors */\n\t--color-background: #fbfcfe;\n\t--color-test-notice-text: #e6a23d;\n\t--color-test-notice-bg: #fefaf6;\n\t--color-test-notice-border: #f6dcb7;\n\t--color-card-bg: #ffffff;\n\t--color-card-border: #dbdfe7;\n\t--color-card-shadow: rgba(99, 77, 255, 0.06);\n\t--color-link: #7e8186;\n\t--color-header: #525356;\n\t--color-label: #555555;\n\t--color-input-border: #dbdfe7;\n\t--color-input-text: #71747A;\n\t--color-focus-border: rgb(90, 76, 194);\n\t--color-submit-btn-bg: #ff6d5a;\n\t--color-submit-btn-text: #ffffff;\n\t--color-error: #ea1f30;\n\t--color-required: #ff6d5a;\n\t--color-clear-button-bg: #7e8186;\n\t--color-html-text: #555;\n\t--color-html-link: #ff6d5a;\n\t--color-header-subtext: #7e8186;\n\n\t/* Border Radii */\n\t--border-radius-card: 8px;\n\t--border-radius-input: 6px;\n\t--border-radius-clear-btn: 50%;\n\t--card-border-radius: 8px;\n\n\t/* Spacing */\n\t--padding-container-top: 24px;\n\t--padding-card: 24px;\n\t--padding-test-notice-vertical: 12px;\n\t--padding-test-notice-horizontal: 24px;\n\t--margin-bottom-card: 16px;\n\t--padding-form-input: 12px;\n\t--card-padding: 24px;\n\t--card-margin-bottom: 16px;\n\n\t/* Dimensions */\n\t--container-width: 448px;\n\t--submit-btn-height: 48px;\n\t--checkbox-size: 18px;\n\n\t/* Others */\n\t--box-shadow-card: 0px 4px 16px 0px var(--color-card-shadow);\n\t--opacity-placeholder: 0.5;\n}","description":"Override default styling of the response form with CSS"},{"displayName":"Limit Wait Time","name":"limitWaitTime","type":"fixedCollection","description":"Whether to limit the time this node should wait for a user response before execution resumes","default":{"values":{"limitType":"afterTimeInterval","resumeAmount":45,"resumeUnit":"minutes"}},"options":[{"displayName":"Values","name":"values","values":[{"displayName":"Limit Type","name":"limitType","type":"options","default":"afterTimeInterval","description":"Sets the condition for the execution to resume. Can be a specified date or after some time.","options":[{"name":"After Time Interval","description":"Waits for a certain amount of time","value":"afterTimeInterval"},{"name":"At Specified Time","description":"Waits until the set date and time to continue","value":"atSpecifiedTime"}]},{"displayName":"Amount","name":"resumeAmount","type":"number","displayOptions":{"show":{"limitType":["afterTimeInterval"]}},"typeOptions":{"minValue":0,"numberPrecision":2},"default":1,"description":"The time to wait"},{"displayName":"Unit","name":"resumeUnit","type":"options","displayOptions":{"show":{"limitType":["afterTimeInterval"]}},"options":[{"name":"Minutes","value":"minutes"},{"name":"Hours","value":"hours"},{"name":"Days","value":"days"}],"default":"hours","description":"Unit of the interval value"},{"displayName":"Max Date and Time","name":"maxDateAndTime","type":"dateTime","displayOptions":{"show":{"limitType":["atSpecifiedTime"]}},"default":"","description":"Continue execution after the specified date and time"}]}]},{"displayName":"Append n8n Attribution","name":"appendAttribution","type":"boolean","default":true,"description":"Whether to include the phrase \"This message was sent automatically with n8n\" to the end of the message"}],"displayOptions":{"show":{"resource":["message"],"operation":["sendAndWait"],"responseType":["freeText","customForm"]},"hide":{}}},{"displayName":"Thread ID","name":"threadId","type":"string","default":"","required":true,"description":"The ID of the thread you are operating on","displayOptions":{"show":{"resource":["thread"],"operation":["get","delete","reply","trash","untrash"]}}},{"displayName":"Message Snippet or ID","name":"messageId","type":"options","typeOptions":{"loadOptionsMethod":"getThreadMessages","loadOptionsDependsOn":["threadId"]},"default":"","description":"Choose from the list, or specify an ID using an <a href=\"https://docs.n8n.io/code/expressions/\">expression</a>","displayOptions":{"show":{"resource":["thread"],"operation":["reply"]}}},{"displayName":"Email Type","name":"emailType","type":"options","default":"text","required":true,"noDataExpression":true,"options":[{"name":"Text","value":"text"},{"name":"HTML","value":"html"}],"displayOptions":{"show":{"resource":["thread"],"operation":["reply"]}}},{"displayName":"Message","name":"message","type":"string","default":"","required":true,"displayOptions":{"show":{"resource":["thread"],"operation":["reply"]}},"hint":"Get better Text and Expressions writing experience by using the expression editor"},{"displayName":"Options","name":"options","type":"collection","placeholder":"Add option","displayOptions":{"show":{"resource":["thread"],"operation":["reply"]}},"default":{},"options":[{"displayName":"Attachments","name":"attachmentsUi","placeholder":"Add Attachment","type":"fixedCollection","typeOptions":{"multipleValues":true},"options":[{"name":"attachmentsBinary","displayName":"Attachment Binary","values":[{"displayName":"Attachment Field Name","name":"property","type":"string","default":"","description":"Add the field name from the input node. Multiple properties can be set separated by comma."}]}],"default":{},"description":"Array of supported attachments to add to the message"},{"displayName":"BCC","name":"bccList","type":"string","description":"The email addresses of the blind copy recipients. Multiple addresses can be separated by a comma. e.g. jay@getsby.com, jon@smith.com.","placeholder":"info@example.com","default":""},{"displayName":"CC","name":"ccList","type":"string","description":"The email addresses of the copy recipients. Multiple addresses can be separated by a comma. e.g. jay@getsby.com, jon@smith.com.","placeholder":"info@example.com","default":""},{"displayName":"Sender Name","name":"senderName","type":"string","placeholder":"e.g. Nathan","default":"","description":"The name displayed in your contacts inboxes"},{"displayName":"Reply to Sender Only","name":"replyToSenderOnly","type":"boolean","default":false,"description":"Whether to reply to the sender only or to the entire list of recipients","displayOptions":{"hide":{"replyToRecipientsOnly":[true]}}},{"displayName":"Reply to Recipients Only","name":"replyToRecipientsOnly","type":"boolean","default":false,"description":"Whether to exclude the sender from the reply","displayOptions":{"hide":{"replyToSenderOnly":[true]}}}]},{"displayName":"Simplify","name":"simple","type":"boolean","displayOptions":{"show":{"operation":["get"],"resource":["thread"]}},"default":true,"description":"Whether to return a simplified version of the response instead of the raw data","builderHint":{"propertyHint":"Keep true by default. When true, returns lightweight metadata (labels, subject, from, to, snippet) for each message in the thread. When false, fetches and parses the full raw thread (adds html, text, textAsHtml, headers, attachments for every message), which uses much more memory and is a common cause of out-of-memory crashes. Only set false when the email body is actually required, e.g. for AI classification, summarization, or content processing."}},{"displayName":"Simplify already returns the key fields most workflows need. The full response is much larger and can cause out-of-memory errors. Only turn Simplify off if you need the raw email body, attachments or other fields not available in the simplified response.","name":"simplifyMemoryNotice","type":"notice","default":"","displayOptions":{"show":{"operation":["get"],"resource":["thread"],"simple":[false]}}},{"displayName":"Options","name":"options","type":"collection","placeholder":"Add Field","displayOptions":{"show":{"resource":["thread"],"operation":["get"]}},"default":{},"options":[{"displayName":"Return Only Messages","name":"returnOnlyMessages","type":"boolean","default":true,"description":"Whether to return only thread messages"}]},{"displayName":"Return All","name":"returnAll","type":"boolean","displayOptions":{"show":{"operation":["getAll"],"resource":["thread"]}},"default":false,"description":"Whether to return all results or only up to a given limit"},{"displayName":"Limit","name":"limit","type":"number","displayOptions":{"show":{"operation":["getAll"],"resource":["thread"],"returnAll":[false]}},"typeOptions":{"minValue":1,"maxValue":500},"default":50,"description":"Max number of results to return"},{"displayName":"Fetching a lot of messages may take a long time. Consider using filters to speed things up","name":"filtersNotice","type":"notice","default":"","displayOptions":{"show":{"operation":["getAll"],"resource":["thread"],"returnAll":[true]}}},{"displayName":"Filters","name":"filters","type":"collection","placeholder":"Add Filter","default":{},"displayOptions":{"show":{"operation":["getAll"],"resource":["thread"]}},"options":[{"displayName":"Include Spam and Trash","name":"includeSpamTrash","type":"boolean","default":false,"description":"Whether to include threads from SPAM and TRASH in the results"},{"displayName":"Label ID Names or IDs","name":"labelIds","type":"multiOptions","typeOptions":{"loadOptionsMethod":"getLabels"},"default":[],"description":"Only return threads with labels that match all of the specified label IDs. Choose from the list, or specify IDs using an <a href=\"https://docs.n8n.io/code/expressions/\">expression</a>."},{"displayName":"Search","name":"q","type":"string","default":"","placeholder":"has:attachment","hint":"Use the same format as in the Gmail search box. <a href=\"https://support.google.com/mail/answer/7190?hl=en\">More info</a>.","description":"Only return messages matching the specified query"},{"displayName":"Read Status","name":"readStatus","type":"options","default":"unread","hint":"Filter emails by whether they have been read or not","options":[{"name":"Unread and read emails","value":"both"},{"name":"Unread emails only","value":"unread"},{"name":"Read emails only","value":"read"}]},{"displayName":"Received After","name":"receivedAfter","type":"dateTime","default":"","description":"Get all emails received after the specified date. In an expression you can set date using string in ISO format or a timestamp in miliseconds."},{"displayName":"Received Before","name":"receivedBefore","type":"dateTime","default":"","description":"Get all emails received before the specified date. In an expression you can set date using string in ISO format or a timestamp in miliseconds."}]},{"displayName":"Thread ID","name":"threadId","type":"string","default":"","required":true,"placeholder":"172ce2c4a72cc243","displayOptions":{"show":{"resource":["thread"],"operation":["addLabels","removeLabels"]}}},{"displayName":"Label Names or IDs","name":"labelIds","type":"multiOptions","typeOptions":{"loadOptionsMethod":"getLabels"},"default":[],"required":true,"displayOptions":{"show":{"resource":["thread"],"operation":["addLabels","removeLabels"]}},"description":"Choose from the list, or specify IDs using an <a href=\"https://docs.n8n.io/code/expressions/\">expression</a>"}],"sourceCounts":{"draft":10,"label":5,"message":20,"sendAndWait":11,"thread":14}};

const serviceCredentialFields = [{"key":"serviceRegion","n8nKey":"region","label":"Region","kind":"select","value":"global","required":false,"options":[{"label":"Global (multi-region) - global","value":"global"},{"label":"EU (multi-region) - eu","value":"eu"},{"label":"US (multi-region) - us","value":"us"},{"label":"Africa (Johannesburg) - africa-south1","value":"africa-south1"},{"label":"Asia Pacific (Changhua County) - asia-east1","value":"asia-east1"},{"label":"Asia Pacific (Hong Kong) - asia-east2","value":"asia-east2"},{"label":"Asia Pacific (Tokyo) - asia-northeast1","value":"asia-northeast1"},{"label":"Asia Pacific (Osaka) - asia-northeast2","value":"asia-northeast2"},{"label":"Asia Pacific (Seoul) - asia-northeast3","value":"asia-northeast3"},{"label":"Asia Pacific (Mumbai) - asia-south1","value":"asia-south1"},{"label":"Asia Pacific (Delhi) - asia-south2","value":"asia-south2"},{"label":"Asia Pacific (Jurong West) - asia-southeast1","value":"asia-southeast1"},{"label":"Asia Pacific (Jakarta) - asia-southeast2","value":"asia-southeast2"},{"label":"Asia Pacific (Sydney) - australia-southeast1","value":"australia-southeast1"},{"label":"Asia Pacific (Melbourne) - australia-southeast2","value":"australia-southeast2"},{"label":"Europe (Warsaw) - europe-central2","value":"europe-central2"},{"label":"Europe (Hamina) - europe-north1","value":"europe-north1"},{"label":"Europe (Madrid) - europe-southwest1","value":"europe-southwest1"},{"label":"Europe (St. Ghislain) - europe-west1","value":"europe-west1"},{"label":"Europe (Berlin) - europe-west10","value":"europe-west10"},{"label":"Europe (Turin) - europe-west12","value":"europe-west12"},{"label":"Europe (London) - europe-west2","value":"europe-west2"},{"label":"Europe (Frankfurt) - europe-west3","value":"europe-west3"},{"label":"Europe (Eemshaven) - europe-west4","value":"europe-west4"},{"label":"Europe (Zurich) - europe-west6","value":"europe-west6"},{"label":"Europe (Milan) - europe-west8","value":"europe-west8"},{"label":"Europe (Paris) - europe-west9","value":"europe-west9"},{"label":"Middle East (Doha) - me-central1","value":"me-central1"},{"label":"Middle East (Dammam) - me-central2","value":"me-central2"},{"label":"Middle East (Tel Aviv) - me-west1","value":"me-west1"},{"label":"Americas (Montréal) - northamerica-northeast1","value":"northamerica-northeast1"},{"label":"Americas (Toronto) - northamerica-northeast2","value":"northamerica-northeast2"},{"label":"Americas (Queretaro) - northamerica-south1","value":"northamerica-south1"},{"label":"Americas (Osasco) - southamerica-east1","value":"southamerica-east1"},{"label":"Americas (Santiago) - southamerica-west1","value":"southamerica-west1"},{"label":"Americas (Council Bluffs) - us-central1","value":"us-central1"},{"label":"Americas (Moncks Corner) - us-east1","value":"us-east1"},{"label":"Americas (Ashburn) - us-east4","value":"us-east4"},{"label":"Americas (Columbus) - us-east5","value":"us-east5"},{"label":"Americas (Dallas) - us-south1","value":"us-south1"},{"label":"Americas (The Dalles) - us-west1","value":"us-west1"},{"label":"Americas (Los Angeles) - us-west2","value":"us-west2"},{"label":"Americas (Salt Lake City) - us-west3","value":"us-west3"},{"label":"Americas (Las Vegas) - us-west4","value":"us-west4"}],"description":"The region where the Google Cloud service is located. This applies only to specific nodes, like the Google Vertex Chat Model"},{"key":"serviceEmail","n8nKey":"email","label":"Service Account Email","kind":"text","value":"","required":true,"placeholder":"name@email.com","description":"The Google Service account similar to user-808@project.iam.gserviceaccount.com"},{"key":"servicePrivateKey","n8nKey":"privateKey","label":"Private Key","kind":"textarea","value":"","required":true,"password":true,"rows":4,"placeholder":"-----BEGIN PRIVATE KEY-----\nXIYEvQIBADANBg<...>0IhA7TMoGYPQc=\n-----END PRIVATE KEY-----\n","description":"Enter the private key located in the JSON file downloaded from Google Cloud Console"},{"key":"serviceImpersonate","n8nKey":"inpersonate","label":"Impersonate a User","kind":"boolean","value":false,"required":false},{"key":"serviceDelegatedEmail","n8nKey":"delegatedEmail","label":"Email","kind":"text","value":"","required":false,"showWhen":{"serviceImpersonate":[true]},"n8nShowWhen":{"inpersonate":[true]},"description":"The email address of the user for which the application is requesting delegated access"},{"key":"serviceHttpNode","n8nKey":"httpNode","label":"Set up for use in HTTP Request node","kind":"boolean","value":false,"required":false},{"key":"serviceHttpWarning","n8nKey":"httpWarning","label":"When using the HTTP Request node, you must specify the scopes you want to send. In other nodes, they're added automatically","kind":"notice","value":"","required":false,"showWhen":{"serviceHttpNode":[true]},"n8nShowWhen":{"httpNode":[true]}},{"key":"serviceScopes","n8nKey":"scopes","label":"Scope(s)","kind":"text","value":"","required":false,"showWhen":{"serviceHttpNode":[true]},"n8nShowWhen":{"httpNode":[true]},"description":"OAuth scopes for services, separated by commas, spaces, or line breaks"}];

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

const versionConditionMatches = (condition) => {
  if (typeof condition === 'number') return condition === currentVersion;
  const rule = condition?._cnd ?? {};
  if (rule.lt !== undefined && !(currentVersion < rule.lt)) return false;
  if (rule.lte !== undefined && !(currentVersion <= rule.lte)) return false;
  if (rule.gt !== undefined && !(currentVersion > rule.gt)) return false;
  if (rule.gte !== undefined && !(currentVersion >= rule.gte)) return false;
  if (rule.eq !== undefined && currentVersion !== rule.eq) return false;
  return true;
};

const visibleAtCurrentVersion = (property) => {
  const shown = property.displayOptions?.show?.['@version'];
  if (shown && !shown.some(versionConditionMatches)) return false;
  const hidden = property.displayOptions?.hide?.['@version'];
  if (hidden && hidden.some(versionConditionMatches)) return false;
  return true;
};

const pascal = (value) => String(value)
  .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
  .replace(/^(.)/, (_, char) => char.toUpperCase());

const sourceContext = (property) => ({
  resources: property.displayOptions?.show?.resource ?? [],
  operations: property.displayOptions?.show?.operation ?? [],
});

const currentRawFields = rawBundle.fields.filter(visibleAtCurrentVersion);
const keyCounts = new Map();
const records = currentRawFields.map((property) => {
  const context = sourceContext(property);
  let keyBase;
  if (property.name === 'operation') {
    keyBase = (context.resources[0] ?? 'resource') + 'Operation';
  } else {
    const resourcePart = context.resources.length ? context.resources.join('Or') : 'global';
    const operationPart = context.operations.length ? context.operations.join('Or') : 'all';
    keyBase = resourcePart + pascal(operationPart) + pascal(property.name);
  }
  const count = (keyCounts.get(keyBase) ?? 0) + 1;
  keyCounts.set(keyBase, count);
  return { property, context, key: count === 1 ? keyBase : keyBase + count };
});

const intersects = (left, right) =>
  !left.length || !right.length || left.some((value) => right.includes(value));

const findTopKey = (nativeName, owner) => {
  if (nativeName === 'resource') return 'resource';
  if (nativeName === 'authentication') return 'authentication';
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
    if (sourceKey === '@version') continue;
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
  if (property.type === 'json') return 'textarea';
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
  const visible = (properties ?? []).filter(visibleAtCurrentVersion);
  const counts = new Map();
  const siblingRecords = visible.map((property) => {
    const base = property.name || 'field';
    const count = (counts.get(base) ?? 0) + 1;
    counts.set(base, count);
    return { property, context: owner.context, key: count === 1 ? base : base + count };
  });
  return siblingRecords.map((record) => normalizeProperty(record, owner, siblingRecords));
};

const normalizeProperty = (record, owner = record, siblingRecords = []) => {
  const property = record.property;
  const kind = sourceKindToCatalogKind(property);
  const sourceShow = property.displayOptions?.show;
  const sourceHide = property.displayOptions?.hide;
  const normalized = {
    key: record.key,
    n8nKey: property.name,
    label: property.displayName || property.name,
    kind,
    sourceKind: property.type,
    value: fallbackValue(property),
    required: property.required === true,
  };

  if (property.description) normalized.description = property.description;
  if (property.placeholder) normalized.placeholder = property.placeholder;
  if (property.hint) normalized.hint = property.hint;
  if (property.noDataExpression) normalized.noDataExpression = true;
  if (property.typeOptions?.rows) normalized.rows = property.typeOptions.rows;
  if (property.typeOptions?.minValue !== undefined) normalized.min = property.typeOptions.minValue;
  if (property.typeOptions?.maxValue !== undefined) normalized.max = property.typeOptions.maxValue;
  if (property.typeOptions?.numberPrecision !== undefined) normalized.precision = property.typeOptions.numberPrecision;
  if (property.typeOptions?.password) normalized.password = true;
  if (property.validateType) normalized.validateType = property.validateType;
  if (property.ignoreValidationDuringExecution) normalized.ignoreValidationDuringExecution = true;

  const showWhen = mapConditions(sourceShow, owner, siblingRecords);
  const hideWhen = mapConditions(sourceHide, owner, siblingRecords);
  if (showWhen) normalized.showWhen = showWhen;
  if (hideWhen) normalized.hideWhen = hideWhen;
  if (sourceShow) normalized.n8nShowWhen = sourceShow;
  if (sourceHide) normalized.n8nHideWhen = sourceHide;
  if (sourceShow?.['@version'] || sourceHide?.['@version']) {
    normalized.sourceVersionDisplayOptions = {
      ...(sourceShow?.['@version'] ? { show: sourceShow['@version'] } : {}),
      ...(sourceHide?.['@version'] ? { hide: sourceHide['@version'] } : {}),
    };
  }

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
    const group = (property.options ?? [])[0] ?? {};
    normalized.sourceDefault = fallbackValue(property);
    normalized.collectionKey = group.name ?? 'values';
    normalized.collectionLabel = group.displayName ?? 'Values';
    normalized.addLabel = property.placeholder ?? property.typeOptions?.multipleValueButtonText ?? 'Add Item';
    normalized.multiple = property.typeOptions?.multipleValues === true;
    normalized.sortable = property.typeOptions?.sortable === true;
    normalized.fields = normalizeChildren(group.values, owner);
  }

  if (property.type === 'json') {
    normalized.editor = 'json';
    normalized.simulationNote = 'JSON is stored as inert authoring text and is never parsed.';
  }

  if (property.type === 'dateTime') {
    normalized.simulationNote = 'Date and time remains inert authoring text and is never parsed or scheduled.';
  }

  return normalized;
};

const resourceFields = records.map((record) => normalizeProperty(record));
const operationFields = ['draft', 'label', 'message', 'thread'].map((resource) => ({
  key: resource + 'Operation',
  n8nKey: 'operation',
  label: 'Operation',
  kind: 'select',
  sourceKind: 'options',
  value: rawBundle.operations[resource].default,
  required: false,
  noDataExpression: true,
  options: operationOptions[resource],
  showWhen: { resource: [resource] },
  n8nShowWhen: { resource: [resource] },
}));
const serviceFields = serviceCredentialFields.map((field) => ({ ...field }));

const gmailScopes = [
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.compose',
];

const gmailOAuthFields = [
  {
    key: 'oauthCustomScopes', n8nKey: 'customScopes', label: 'Custom Scopes',
    kind: 'boolean', value: false, required: false, description: 'Define custom scopes',
  },
  {
    key: 'oauthCustomScopesNotice', n8nKey: 'customScopesNotice',
    label: 'The default scopes needed for the node to work are already set, If you change these the node may not function correctly.',
    kind: 'notice', value: '', required: false,
    showWhen: { oauthCustomScopes: [true] }, n8nShowWhen: { customScopes: [true] },
  },
  {
    key: 'oauthEnabledScopes', n8nKey: 'enabledScopes', label: 'Enabled Scopes',
    kind: 'text', sourceKind: 'string', value: gmailScopes.join(' '), required: false,
    showWhen: { oauthCustomScopes: [true] }, n8nShowWhen: { customScopes: [true] },
    description: 'Scopes that should be enabled',
  },
  {
    key: 'oauthScope', n8nKey: 'scope', label: 'Scope', kind: 'hidden',
    value: '={{$self["customScopes"] ? $self["enabledScopes"] : "' + gmailScopes.join(' ') + '"}}',
    required: false,
  },
];

const credentialSelector = (key, n8nKey, value, label, authentication) => ({
  key,
  n8nKey,
  label: 'Credential to connect with',
  kind: 'select',
  sourceKind: 'credentials',
  value,
  required: true,
  locked: true,
  dynamic: true,
  showWhen: { authentication: [authentication] },
  options: [{ label, value }],
  simulationNote: lockedCredentialNote,
});

const resources = [
  { value: 'message', defaultOperation: 'send', operations: operationOptions.message.map(({ value }) => value) },
  { value: 'label', defaultOperation: 'getAll', operations: operationOptions.label.map(({ value }) => value) },
  { value: 'draft', defaultOperation: 'create', operations: operationOptions.draft.map(({ value }) => value) },
  { value: 'thread', defaultOperation: 'getAll', operations: operationOptions.thread.map(({ value }) => value) },
];

const gmail = {
  type: 'gmail',
  n8nType: 'n8n-nodes-base.gmail',
  n8nVersion: 2.2,
  defaultVersion: 2.2,
  versionHistory: [1, 2, 2.1, 2.2],
  currentSchemaVersions: [2, 2.1, 2.2],
  label: 'Gmail',
  defaultName: 'Gmail',
  subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
  description: 'Consume the Gmail API',
  category: 'action',
  categories: ['Communication', 'HITL'],
  subcategories: ['Human in the Loop'],
  group: ['transform'],
  defaults: { name: 'Gmail' },
  inputs: ['main'],
  outputs: ['main'],
  usableAsTool: true,
  icon: '/node-icons/gmail.svg',
  n8nIcon: 'file:gmail.svg',
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { width: 256, height: 193 },
  iconAssetSha256: '864152d2835c9c5d659e59a605557c4b644cb7db544e90370e7496eaf647dad0',
  sourceIconAssetSha256: '08c3650190fa87f8715d413d8b3fb84aefbb8be451bdd5adbbb3de96a09dc440',
  aliases: ['email', 'human', 'form', 'wait', 'hitl', 'approval'],
  docs: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/',
  docsByResource: {
    draft: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/draft-operations/',
    label: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/label-operations/',
    message: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/message-operations/',
    thread: 'https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmail/thread-operations/',
  },
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/',
  source: {
    commit: sourceCommit,
    path: 'packages/nodes-base/nodes/Google/Gmail/Gmail.node.ts',
    versionPath: 'packages/nodes-base/nodes/Google/Gmail/v2/GmailV2.node.ts',
    metadataPath: 'packages/nodes-base/nodes/Google/Gmail/Gmail.node.json',
    descriptionPaths: [
      'packages/nodes-base/nodes/Google/Gmail/v2/DraftDescription.ts',
      'packages/nodes-base/nodes/Google/Gmail/v2/LabelDescription.ts',
      'packages/nodes-base/nodes/Google/Gmail/v2/MessageDescription.ts',
      'packages/nodes-base/nodes/Google/Gmail/v2/ThreadDescription.ts',
    ],
    sendAndWaitPaths: [
      'packages/nodes-base/utils/sendAndWait/utils.ts',
      'packages/nodes-base/utils/sendAndWait/descriptions.ts',
      'packages/nodes-base/nodes/Form/Form.node.ts',
      'packages/nodes-base/nodes/Form/common.descriptions.ts',
      'packages/nodes-base/nodes/Form/cssVariables.ts',
    ],
    loadOptionsPath: 'packages/nodes-base/nodes/Google/Gmail/v2/loadOptions.ts',
    credentialPaths: [
      'packages/nodes-base/credentials/GmailOAuth2Api.credentials.ts',
      'packages/nodes-base/credentials/GoogleOAuth2Api.credentials.ts',
      'packages/nodes-base/credentials/OAuth2Api.credentials.ts',
      'packages/nodes-base/credentials/GoogleApi.credentials.ts',
    ],
    iconPath: 'packages/nodes-base/nodes/Google/Gmail/gmail.svg',
    extractedSourceCounts: rawBundle.sourceCounts,
  },
  resources,
  credentialRequirements: [
    {
      type: 'gmailOAuth2', name: 'Gmail OAuth2 API', required: true, inert: true,
      showWhen: { authentication: ['oAuth2'] }, extends: ['googleOAuth2Api', 'oAuth2Api'],
      documentationUrl: 'google/oauth-single-service', fields: gmailOAuthFields,
    },
    {
      type: 'googleApi', name: 'Google Service Account API', required: true, inert: true,
      showWhen: { authentication: ['serviceAccount'] },
      documentationUrl: 'google/service-account', fields: serviceFields,
    },
  ],
  credentialUiMetadata: [
    {
      key: 'gmailOAuth2Credential', type: 'gmailOAuth2', name: 'Gmail OAuth2 API',
      sourcePath: 'packages/nodes-base/credentials/GmailOAuth2Api.credentials.ts',
      renderedInCredentialEditor: false, inert: true,
    },
    {
      key: 'googleServiceAccountCredential', type: 'googleApi', name: 'Google Service Account API',
      sourcePath: 'packages/nodes-base/credentials/GoogleApi.credentials.ts',
      renderedInCredentialEditor: false, inert: true,
    },
  ],
  waitingNodeTooltip: {
    sourceConstant: 'SEND_AND_WAIT_WAITING_TOOLTIP',
    inert: true,
  },
  webhooks: [
    {
      name: 'default', httpMethod: 'GET', responseMode: 'onReceived', responseData: '',
      path: '={{ $nodeId }}', restartWebhook: true, isFullPath: true, inert: true,
    },
    {
      name: 'default', httpMethod: 'POST', responseMode: 'onReceived', responseData: '',
      path: '={{ $nodeId }}', restartWebhook: true, isFullPath: true, inert: true,
    },
  ],
  sendAndWaitMetadata: {
    resource: 'message',
    operation: 'sendAndWait',
    responseTypes: ['approval', 'freeText', 'customForm'],
    waitsForResponse: false,
    webhookHandling: false,
    formRendering: false,
  },
  params: [
    {
      key: 'authentication', n8nKey: 'authentication', label: 'Authentication',
      kind: 'select', sourceKind: 'options', value: 'oAuth2', required: false,
      options: [
        { label: 'OAuth2 (recommended)', value: 'oAuth2' },
        { label: 'Service Account', value: 'serviceAccount' },
      ],
    },
    credentialSelector('gmailOAuth2Credential', 'credentials.gmailOAuth2', 'gmailOAuth2', 'Gmail OAuth2 API', 'oAuth2'),
    credentialSelector('googleServiceAccountCredential', 'credentials.googleApi', 'googleApi', 'Google Service Account API', 'serviceAccount'),
    {
      key: 'resource', n8nKey: 'resource', label: 'Resource', kind: 'select', sourceKind: 'options',
      value: 'message', required: false, noDataExpression: true,
      options: [
        { label: 'Message', value: 'message' },
        { label: 'Label', value: 'label' },
        { label: 'Draft', value: 'draft' },
        { label: 'Thread', value: 'thread' },
      ],
    },
    ...operationFields,
    ...resourceFields,
  ],
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
    sourceOfTruth: 'Pinned implementation; official n8n resource pages are supplementary.',
    documentedSendAndWait: true,
    documentedAuthenticationMethods: ['oAuth2', 'serviceAccount'],
    aiToolDocumented: true,
  },
  lookupMetadata: {
    getLabels: { parameters: ['labelIds'], networkAccess: false },
    getThreadMessages: { parameters: ['messageId'], dependsOn: ['threadId'], networkAccess: false },
    getGmailAliases: { parameters: ['fromAlias'], networkAccess: false },
  },
  versionBranches: [
    { versions: '1', implementation: 'GmailV1', representedInCurrentParams: false },
    { versions: '2 - 2.2', implementation: 'GmailV2', representedInCurrentParams: true },
    {
      versions: '>= 2.1', n8nKey: 'options.appendAttribution',
      default: true, representedInCurrentParams: true,
    },
    {
      versions: '< 2.5', n8nKey: 'formFields',
      sourceKind: 'fixedCollection', representedInCurrentParams: true,
    },
  ],
  platformGaps: [
    'The native schema reuses operation, messageId, emailType, message, simple, returnAll, limit, filters, labelIds, options, and other names across conditional branches. Context-derived UI keys keep every current branch unique while n8nKey records the native name.',
    'Label, alias, and thread-message options normally invoke getLabels, getGmailAliases, and getThreadMessages. Their method names and dependencies are retained, but every remote list is locked and empty.',
    'Native JSON and dateTime controls are normalized to inert textarea and text fields. No JSON or date is parsed.',
    'Send and Wait exposes approval, free-text, and custom-form authoring, including the current pre-v2.5 form-field collection and wait-limit controls. Webhook, public form, response, resume, and timeout behavior is metadata only.',
    'The two native restart webhook descriptions are retained as inert metadata. No listener, route, browser form, wait state, or execution resume is created.',
    'OAuth and service-account schemas are metadata only. The simulation never authorizes, signs JWTs, refreshes tokens, impersonates users, or calls Gmail.',
    'The source marks Gmail usableAsTool. This is capability metadata only; no static AI Tool connector or executable tool runtime is added.',
  ],
  unsupportedVisibleTypes: [
    {
      n8nKey: 'credentials.gmailOAuth2/credentials.googleApi', sourceType: 'credentials',
      normalizedKind: 'locked select', reason: 'Credential discovery and editors are unavailable.',
    },
    {
      n8nKey: 'labelIds/messageId/fromAlias', sourceType: 'options or multiOptions with loadOptionsMethod',
      normalizedKind: 'locked select or multiSelect', reason: 'Remote Gmail lookup is disabled.',
    },
    {
      n8nKey: 'jsonOutput', sourceType: 'json', normalizedKind: 'textarea',
      reason: 'JSON stays inert authoring text and is never parsed.',
    },
    {
      n8nKey: 'receivedAfter/receivedBefore/maxDateAndTime', sourceType: 'dateTime',
      normalizedKind: 'text', reason: 'Dates remain inert text and are never interpreted.',
    },
  ],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    credentialCreation: false,
    credentialTesting: false,
    authentication: false,
    oauthAuthorization: false,
    oauthRefresh: false,
    serviceAccountJwtSigning: false,
    impersonation: false,
    labelLookup: false,
    aliasLookup: false,
    threadMessageLookup: false,
    apiRequests: false,
    networkAccess: false,
    emailSending: false,
    emailReplying: false,
    draftMutation: false,
    labelMutation: false,
    messageMutation: false,
    threadMutation: false,
    attachmentAccess: false,
    attachmentTransfer: false,
    jsonParsing: false,
    dateParsing: false,
    webhookHandling: false,
    formRendering: false,
    waiting: false,
    executionResume: false,
    textToSpeech: false,
    voice: false,
  },
  output: {},
};

export default gmail;
