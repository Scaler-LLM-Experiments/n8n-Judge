// Static authoring descriptor for n8n's Stripe Trigger v1. Stripe API,
// credential, webhook, signature verification, network, and execution stay inert.

const eventOptions = [
  {
    "label": "*",
    "value": "*",
    "description": "Any time any event is triggered (Wildcard Event)"
  },
  {
    "label": "Account Updated",
    "value": "account.updated",
    "description": "Occurs whenever an account status or property has changed"
  },
  {
    "label": "Account Application.authorized",
    "value": "account.application.authorized",
    "description": "Occurs whenever a user authorizes an application. Sent to the related application only."
  },
  {
    "label": "Account Application.deauthorized",
    "value": "account.application.deauthorized",
    "description": "Occurs whenever a user deauthorizes an application. Sent to the related application only."
  },
  {
    "label": "Account External_account.created",
    "value": "account.external_account.created",
    "description": "Occurs whenever an external account is created."
  },
  {
    "label": "Account External_account.deleted",
    "value": "account.external_account.deleted",
    "description": "Occurs whenever an external account is deleted."
  },
  {
    "label": "Account External_account.updated",
    "value": "account.external_account.updated",
    "description": "Occurs whenever an external account is updated."
  },
  {
    "label": "Application Fee.created",
    "value": "application_fee.created",
    "description": "Occurs whenever an application fee is created on a charge."
  },
  {
    "label": "Application Fee.refunded",
    "value": "application_fee.refunded",
    "description": "Occurs whenever an application fee is refunded, whether from refunding a charge or from refunding the application fee directly. This includes partial refunds."
  },
  {
    "label": "Application Fee.refund.updated",
    "value": "application_fee.refund.updated",
    "description": "Occurs whenever an application fee refund is updated."
  },
  {
    "label": "Balance Available",
    "value": "balance.available",
    "description": "Occurs whenever your Stripe balance has been updated (e.g., when a charge is available to be paid out). By default, Stripe automatically transfers funds in your balance to your bank account on a daily basis."
  },
  {
    "label": "Capability Updated",
    "value": "capability.updated",
    "description": "Occurs whenever a capability has new requirements or a new status."
  },
  {
    "label": "Charge Captured",
    "value": "charge.captured",
    "description": "Occurs whenever a previously uncaptured charge is captured."
  },
  {
    "label": "Charge Expired",
    "value": "charge.expired",
    "description": "Occurs whenever an uncaptured charge expires."
  },
  {
    "label": "Charge Failed",
    "value": "charge.failed",
    "description": "Occurs whenever a failed charge attempt occurs."
  },
  {
    "label": "Charge Pending",
    "value": "charge.pending",
    "description": "Occurs whenever a pending charge is created."
  },
  {
    "label": "Charge Refunded",
    "value": "charge.refunded",
    "description": "Occurs whenever a charge is refunded, including partial refunds."
  },
  {
    "label": "Charge Succeeded",
    "value": "charge.succeeded",
    "description": "Occurs whenever a new charge is created and is successful."
  },
  {
    "label": "Charge Updated",
    "value": "charge.updated",
    "description": "Occurs whenever a charge description or metadata is updated."
  },
  {
    "label": "Charge Dispute.closed",
    "value": "charge.dispute.closed",
    "description": "Occurs when a dispute is closed and the dispute status changes to lost, warning_closed, or won."
  },
  {
    "label": "Charge Dispute.created",
    "value": "charge.dispute.created",
    "description": "Occurs whenever a customer disputes a charge with their bank."
  },
  {
    "label": "Charge Dispute.funds_reinstated",
    "value": "charge.dispute.funds_reinstated",
    "description": "Occurs when funds are reinstated to your account after a dispute is closed. This includes partially refunded payments."
  },
  {
    "label": "Charge Dispute.funds_withdrawn",
    "value": "charge.dispute.funds_withdrawn",
    "description": "Occurs when funds are removed from your account due to a dispute."
  },
  {
    "label": "Charge Dispute.updated",
    "value": "charge.dispute.updated",
    "description": "Occurs when the dispute is updated (usually with evidence)."
  },
  {
    "label": "Charge Refund.updated",
    "value": "charge.refund.updated",
    "description": "Occurs whenever a refund is updated, on selected payment methods."
  },
  {
    "label": "Checkout Session.completed",
    "value": "checkout.session.completed",
    "description": "Occurs when a Checkout Session has been successfully completed."
  },
  {
    "label": "Coupon Created",
    "value": "coupon.created",
    "description": "Occurs whenever a coupon is created."
  },
  {
    "label": "Coupon Deleted",
    "value": "coupon.deleted",
    "description": "Occurs whenever a coupon is deleted."
  },
  {
    "label": "Coupon Updated",
    "value": "coupon.updated",
    "description": "Occurs whenever a coupon is updated."
  },
  {
    "label": "Credit Note.created",
    "value": "credit_note.created",
    "description": "Occurs whenever a credit note is created."
  },
  {
    "label": "Credit Note.updated",
    "value": "credit_note.updated",
    "description": "Occurs whenever a credit note is updated."
  },
  {
    "label": "Credit Note.voided",
    "value": "credit_note.voided",
    "description": "Occurs whenever a credit note is voided."
  },
  {
    "label": "Customer Created",
    "value": "customer.created",
    "description": "Occurs whenever a new customer is created."
  },
  {
    "label": "Customer Deleted",
    "value": "customer.deleted",
    "description": "Occurs whenever a customer is deleted."
  },
  {
    "label": "Customer Updated",
    "value": "customer.updated",
    "description": "Occurs whenever any property of a customer changes."
  },
  {
    "label": "Customer Discount.created",
    "value": "customer.discount.created",
    "description": "Occurs whenever a coupon is attached to a customer."
  },
  {
    "label": "Customer Discount.deleted",
    "value": "customer.discount.deleted",
    "description": "Occurs whenever a coupon is removed from a customer."
  },
  {
    "label": "Customer Discount.updated",
    "value": "customer.discount.updated",
    "description": "Occurs whenever a customer is switched from one coupon to another."
  },
  {
    "label": "Customer Source.created",
    "value": "customer.source.created",
    "description": "Occurs whenever a new source is created for a customer."
  },
  {
    "label": "Customer Source.deleted",
    "value": "customer.source.deleted",
    "description": "Occurs whenever a source is removed from a customer."
  },
  {
    "label": "Customer Source.expiring",
    "value": "customer.source.expiring",
    "description": "Occurs whenever a card or source will expire at the end of the month."
  },
  {
    "label": "Customer Source.updated",
    "value": "customer.source.updated",
    "description": "Occurs whenever a source's details are changed."
  },
  {
    "label": "Customer Subscription.created",
    "value": "customer.subscription.created",
    "description": "Occurs whenever a customer is signed up for a new plan."
  },
  {
    "label": "Customer Subscription.deleted",
    "value": "customer.subscription.deleted",
    "description": "Occurs whenever a customer's subscription ends."
  },
  {
    "label": "Customer Subscription.trial_will_end",
    "value": "customer.subscription.trial_will_end",
    "description": "Occurs three days before a subscription's trial period is scheduled to end, or when a trial is ended immediately (using trial_end=now)."
  },
  {
    "label": "Customer Subscription.updated",
    "value": "customer.subscription.updated",
    "description": "Occurs whenever a subscription changes (e.g., switching from one plan to another, or changing the status from trial to active)."
  },
  {
    "label": "Customer Tax_id.created",
    "value": "customer.tax_id.created",
    "description": "Occurs whenever a tax ID is created for a customer."
  },
  {
    "label": "Customer Tax_id.deleted",
    "value": "customer.tax_id.deleted",
    "description": "Occurs whenever a tax ID is deleted from a customer."
  },
  {
    "label": "Customer Tax_id.updated",
    "value": "customer.tax_id.updated",
    "description": "Occurs whenever a customer's tax ID is updated."
  },
  {
    "label": "File Created",
    "value": "file.created",
    "description": "Occurs whenever a new Stripe-generated file is available for your account."
  },
  {
    "label": "Invoice Created",
    "value": "invoice.created",
    "description": "Occurs whenever a new invoice is created. To learn how webhooks can be used with this event, and how they can affect it, see Using Webhooks with Subscriptions."
  },
  {
    "label": "Invoice Deleted",
    "value": "invoice.deleted",
    "description": "Occurs whenever a draft invoice is deleted."
  },
  {
    "label": "Invoice Finalized",
    "value": "invoice.finalized",
    "description": "Occurs whenever a draft invoice is finalized and updated to be an open invoice."
  },
  {
    "label": "Invoice Marked_uncollectible",
    "value": "invoice.marked_uncollectible",
    "description": "Occurs whenever an invoice is marked uncollectible."
  },
  {
    "label": "Invoice Paid",
    "value": "invoice.paid",
    "description": "Occurs whenever an invoice payment attempt succeeds or an invoice is marked as paid out-of-band."
  },
  {
    "label": "Invoice Payment_action_required",
    "value": "invoice.payment_action_required",
    "description": "Occurs whenever an invoice payment attempt requires further user action to complete."
  },
  {
    "label": "Invoice Payment_failed",
    "value": "invoice.payment_failed",
    "description": "Occurs whenever an invoice payment attempt fails, due either to a declined payment or to the lack of a stored payment method."
  },
  {
    "label": "Invoice Payment_paid",
    "value": "invoice_payment.paid",
    "description": "Occurs when an InvoicePayment is successfully paid."
  },
  {
    "label": "Invoice Payment_succeeded",
    "value": "invoice.payment_succeeded",
    "description": "Occurs whenever an invoice payment attempt succeeds."
  },
  {
    "label": "Invoice Sent",
    "value": "invoice.sent",
    "description": "Occurs whenever an invoice email is sent out."
  },
  {
    "label": "Invoice Upcoming",
    "value": "invoice.upcoming",
    "description": "Occurs X number of days before a subscription is scheduled to create an invoice that is automatically charged—where X is determined by your subscriptions settings. Note: The received Invoice object will not have an invoice ID."
  },
  {
    "label": "Invoice Updated",
    "value": "invoice.updated",
    "description": "Occurs whenever an invoice changes (e.g., the invoice amount)."
  },
  {
    "label": "Invoice Voided",
    "value": "invoice.voided",
    "description": "Occurs whenever an invoice is voided."
  },
  {
    "label": "Invoiceitem Created",
    "value": "invoiceitem.created",
    "description": "Occurs whenever an invoice item is created."
  },
  {
    "label": "Invoiceitem Deleted",
    "value": "invoiceitem.deleted",
    "description": "Occurs whenever an invoice item is deleted."
  },
  {
    "label": "Invoiceitem Updated",
    "value": "invoiceitem.updated",
    "description": "Occurs whenever an invoice item is updated."
  },
  {
    "label": "Issuing Authorization.created",
    "value": "issuing_authorization.created",
    "description": "Occurs whenever an authorization is created."
  },
  {
    "label": "Issuing Authorization.request",
    "value": "issuing_authorization.request",
    "description": "Represents a synchronous request for authorization, see Using your integration to handle authorization requests."
  },
  {
    "label": "Issuing Authorization.updated",
    "value": "issuing_authorization.updated",
    "description": "Occurs whenever an authorization is updated."
  },
  {
    "label": "Issuing Card.created",
    "value": "issuing_card.created",
    "description": "Occurs whenever a card is created."
  },
  {
    "label": "Issuing Card.updated",
    "value": "issuing_card.updated",
    "description": "Occurs whenever a card is updated."
  },
  {
    "label": "Issuing Cardholder.created",
    "value": "issuing_cardholder.created",
    "description": "Occurs whenever a cardholder is created."
  },
  {
    "label": "Issuing Cardholder.updated",
    "value": "issuing_cardholder.updated",
    "description": "Occurs whenever a cardholder is updated."
  },
  {
    "label": "Issuing Dispute.created",
    "value": "issuing_dispute.created",
    "description": "Occurs whenever a dispute is created."
  },
  {
    "label": "Issuing Dispute.updated",
    "value": "issuing_dispute.updated",
    "description": "Occurs whenever a dispute is updated."
  },
  {
    "label": "Issuing Settlement.created",
    "value": "issuing_settlement.created",
    "description": "Occurs whenever an issuing settlement is created."
  },
  {
    "label": "Issuing Settlement.updated",
    "value": "issuing_settlement.updated",
    "description": "Occurs whenever an issuing settlement is updated."
  },
  {
    "label": "Issuing Transaction.created",
    "value": "issuing_transaction.created",
    "description": "Occurs whenever an issuing transaction is created."
  },
  {
    "label": "Issuing Transaction.updated",
    "value": "issuing_transaction.updated",
    "description": "Occurs whenever an issuing transaction is updated."
  },
  {
    "label": "Order Created",
    "value": "order.created",
    "description": "Occurs whenever an order is created."
  },
  {
    "label": "Order Payment_failed",
    "value": "order.payment_failed",
    "description": "Occurs whenever an order payment attempt fails."
  },
  {
    "label": "Order Payment_succeeded",
    "value": "order.payment_succeeded",
    "description": "Occurs whenever an order payment attempt succeeds."
  },
  {
    "label": "Order Updated",
    "value": "order.updated",
    "description": "Occurs whenever an order is updated."
  },
  {
    "label": "Order Return.created",
    "value": "order_return.created",
    "description": "Occurs whenever an order return is created."
  },
  {
    "label": "Payment Intent.amount_capturable_updated",
    "value": "payment_intent.amount_capturable_updated",
    "description": "Occurs when a PaymentIntent has funds to be captured. Check the amount_capturable property on the PaymentIntent to determine the amount that can be captured. You may capture the PaymentIntent with an amount_to_capture value up to the specified amount. Learn more about capturing PaymentIntents."
  },
  {
    "label": "Payment Intent.canceled",
    "value": "payment_intent.canceled",
    "description": "Occurs when a PaymentIntent is canceled."
  },
  {
    "label": "Payment Intent.created",
    "value": "payment_intent.created",
    "description": "Occurs when a new PaymentIntent is created."
  },
  {
    "label": "Payment Intent.payment_failed",
    "value": "payment_intent.payment_failed",
    "description": "Occurs when a PaymentIntent has failed the attempt to create a source or a payment."
  },
  {
    "label": "Payment Intent.succeeded",
    "value": "payment_intent.succeeded",
    "description": "Occurs when a PaymentIntent has been successfully fulfilled."
  },
  {
    "label": "Payment Intent.requires_action",
    "value": "payment_intent.requires_action",
    "description": "Occurs when a PaymentIntent requires an action."
  },
  {
    "label": "Payment Method.attached",
    "value": "payment_method.attached",
    "description": "Occurs whenever a new payment method is attached to a customer."
  },
  {
    "label": "Payment Method.card_automatically_updated",
    "value": "payment_method.card_automatically_updated",
    "description": "Occurs whenever a card payment method's details are automatically updated by the network."
  },
  {
    "label": "Payment Method.detached",
    "value": "payment_method.detached",
    "description": "Occurs whenever a payment method is detached from a customer."
  },
  {
    "label": "Payment Method.updated",
    "value": "payment_method.updated",
    "description": "Occurs whenever a payment method is updated via the PaymentMethod update API."
  },
  {
    "label": "Payout Canceled",
    "value": "payout.canceled",
    "description": "Occurs whenever a payout is canceled."
  },
  {
    "label": "Payout Created",
    "value": "payout.created",
    "description": "Occurs whenever a payout is created."
  },
  {
    "label": "Payout Failed",
    "value": "payout.failed",
    "description": "Occurs whenever a payout attempt fails."
  },
  {
    "label": "Payout Paid",
    "value": "payout.paid",
    "description": "Occurs whenever a payout is expected to be available in the destination account. If the payout fails, a payout.failed notification is also sent, at a later time."
  },
  {
    "label": "Payout Updated",
    "value": "payout.updated",
    "description": "Occurs whenever a payout is updated."
  },
  {
    "label": "Person Created",
    "value": "person.created",
    "description": "Occurs whenever a person associated with an account is created."
  },
  {
    "label": "Person Deleted",
    "value": "person.deleted",
    "description": "Occurs whenever a person associated with an account is deleted."
  },
  {
    "label": "Person Updated",
    "value": "person.updated",
    "description": "Occurs whenever a person associated with an account is updated."
  },
  {
    "label": "Plan Created",
    "value": "plan.created",
    "description": "Occurs whenever a plan is created."
  },
  {
    "label": "Plan Deleted",
    "value": "plan.deleted",
    "description": "Occurs whenever a plan is deleted."
  },
  {
    "label": "Plan Updated",
    "value": "plan.updated",
    "description": "Occurs whenever a plan is updated."
  },
  {
    "label": "Product Created",
    "value": "product.created",
    "description": "Occurs whenever a product is created."
  },
  {
    "label": "Product Deleted",
    "value": "product.deleted",
    "description": "Occurs whenever a product is deleted."
  },
  {
    "label": "Product Updated",
    "value": "product.updated",
    "description": "Occurs whenever a product is updated."
  },
  {
    "label": "Radar Early_fraud_warning.created",
    "value": "radar.early_fraud_warning.created",
    "description": "Occurs whenever an early fraud warning is created."
  },
  {
    "label": "Radar Early_fraud_warning.updated",
    "value": "radar.early_fraud_warning.updated",
    "description": "Occurs whenever an early fraud warning is updated."
  },
  {
    "label": "Recipient Created",
    "value": "recipient.created",
    "description": "Occurs whenever a recipient is created."
  },
  {
    "label": "Recipient Deleted",
    "value": "recipient.deleted",
    "description": "Occurs whenever a recipient is deleted."
  },
  {
    "label": "Recipient Updated",
    "value": "recipient.updated",
    "description": "Occurs whenever a recipient is updated."
  },
  {
    "label": "Reporting Report_run.failed",
    "value": "reporting.report_run.failed",
    "description": "Occurs whenever a requested **ReportRun** failed to complete."
  },
  {
    "label": "Reporting Report_run.succeeded",
    "value": "reporting.report_run.succeeded",
    "description": "Occurs whenever a requested **ReportRun** completed succesfully."
  },
  {
    "label": "Reporting Report_type.updated",
    "value": "reporting.report_type.updated",
    "description": "Occurs whenever a **ReportType** is updated (typically to indicate that a new day's data has come available)."
  },
  {
    "label": "Review Closed",
    "value": "review.closed",
    "description": "Occurs whenever a review is closed. The review's reason field indicates why: approved, disputed, refunded, or refunded_as_fraud."
  },
  {
    "label": "Review Opened",
    "value": "review.opened",
    "description": "Occurs whenever a review is opened."
  },
  {
    "label": "Setup Intent.canceled",
    "value": "setup_intent.canceled",
    "description": "Occurs when a SetupIntent is canceled."
  },
  {
    "label": "Setup Intent.created",
    "value": "setup_intent.created",
    "description": "Occurs when a new SetupIntent is created."
  },
  {
    "label": "Setup Intent.setup_failed",
    "value": "setup_intent.setup_failed",
    "description": "Occurs when a SetupIntent has failed the attempt to setup a payment method."
  },
  {
    "label": "Setup Intent.succeeded",
    "value": "setup_intent.succeeded",
    "description": "Occurs when an SetupIntent has successfully setup a payment method."
  },
  {
    "label": "Sigma Scheduled_query_run.created",
    "value": "sigma.scheduled_query_run.created",
    "description": "Occurs whenever a Sigma scheduled query run finishes."
  },
  {
    "label": "Sku Created",
    "value": "sku.created",
    "description": "Occurs whenever a SKU is created."
  },
  {
    "label": "Sku Deleted",
    "value": "sku.deleted",
    "description": "Occurs whenever a SKU is deleted."
  },
  {
    "label": "Sku Updated",
    "value": "sku.updated",
    "description": "Occurs whenever a SKU is updated."
  },
  {
    "label": "Source Canceled",
    "value": "source.canceled",
    "description": "Occurs whenever a source is canceled."
  },
  {
    "label": "Source Chargeable",
    "value": "source.chargeable",
    "description": "Occurs whenever a source transitions to chargeable."
  },
  {
    "label": "Source Failed",
    "value": "source.failed",
    "description": "Occurs whenever a source fails."
  },
  {
    "label": "Source Mandate_notification",
    "value": "source.mandate_notification",
    "description": "Occurs whenever a source mandate notification method is set to manual."
  },
  {
    "label": "Source Refund_attributes_required",
    "value": "source.refund_attributes_required",
    "description": "Occurs whenever the refund attributes are required on a receiver source to process a refund or a mispayment."
  },
  {
    "label": "Source Transaction.created",
    "value": "source.transaction.created",
    "description": "Occurs whenever a source transaction is created."
  },
  {
    "label": "Source Transaction.updated",
    "value": "source.transaction.updated",
    "description": "Occurs whenever a source transaction is updated."
  },
  {
    "label": "Subscription Schedule.aborted",
    "value": "subscription_schedule.aborted",
    "description": "Occurs whenever a subscription schedule is canceled due to the underlying subscription being canceled because of delinquency."
  },
  {
    "label": "Subscription Schedule.canceled",
    "value": "subscription_schedule.canceled",
    "description": "Occurs whenever a subscription schedule is canceled."
  },
  {
    "label": "Subscription Schedule.completed",
    "value": "subscription_schedule.completed",
    "description": "Occurs whenever a new subscription schedule is completed."
  },
  {
    "label": "Subscription Schedule.created",
    "value": "subscription_schedule.created",
    "description": "Occurs whenever a new subscription schedule is created."
  },
  {
    "label": "Subscription Schedule.expiring",
    "value": "subscription_schedule.expiring",
    "description": "Occurs 7 days before a subscription schedule will expire."
  },
  {
    "label": "Subscription Schedule.released",
    "value": "subscription_schedule.released",
    "description": "Occurs whenever a new subscription schedule is released."
  },
  {
    "label": "Subscription Schedule.updated",
    "value": "subscription_schedule.updated",
    "description": "Occurs whenever a subscription schedule is updated."
  },
  {
    "label": "Tax Rate.created",
    "value": "tax_rate.created",
    "description": "Occurs whenever a new tax rate is created."
  },
  {
    "label": "Tax Rate.updated",
    "value": "tax_rate.updated",
    "description": "Occurs whenever a tax rate is updated."
  },
  {
    "label": "Topup Canceled",
    "value": "topup.canceled",
    "description": "Occurs whenever a top-up is canceled."
  },
  {
    "label": "Topup Created",
    "value": "topup.created",
    "description": "Occurs whenever a top-up is created."
  },
  {
    "label": "Topup Failed",
    "value": "topup.failed",
    "description": "Occurs whenever a top-up fails."
  },
  {
    "label": "Topup Reversed",
    "value": "topup.reversed",
    "description": "Occurs whenever a top-up is reversed."
  },
  {
    "label": "Topup Succeeded",
    "value": "topup.succeeded",
    "description": "Occurs whenever a top-up succeeds."
  },
  {
    "label": "Transfer Created",
    "value": "transfer.created",
    "description": "Occurs whenever a transfer is created."
  },
  {
    "label": "Transfer Failed",
    "value": "transfer.failed",
    "description": "Occurs whenever a transfer failed."
  },
  {
    "label": "Transfer Paid",
    "value": "transfer.paid",
    "description": "Occurs after a transfer is paid. For Instant Payouts, the event will be sent on the next business day, although the funds should be received well beforehand."
  },
  {
    "label": "Transfer Reversed",
    "value": "transfer.reversed",
    "description": "Occurs whenever a transfer is reversed, including partial reversals."
  },
  {
    "label": "Transfer Updated",
    "value": "transfer.updated",
    "description": "Occurs whenever a transfer's description or metadata is updated."
  }
];

const stripeTrigger = {
  type: 'stripe-trigger',
  n8nType: 'n8n-nodes-base.stripeTrigger',
  n8nVersion: 1,
  defaultVersion: 1,
  versionHistory: [1],
  currentSchemaVersions: [1],
  label: 'Stripe Trigger',
  defaultName: 'Stripe Trigger',
  description: 'Handle Stripe events via webhooks',
  category: 'trigger',
  categories: ['Finance & Accounting', 'Sales'],
  subcategories: [],
  group: ['trigger'],
  defaults: { name: 'Stripe Trigger' },
  inputs: [],
  outputs: ['main'],
  icon: '/node-icons/stripe.svg',
  n8nIcon: 'file:stripe.svg',
  iconMode: 'image',
  iconAssetType: 'svg',
  iconAssetSize: { width: 360, height: 360, viewBox: '54 -80 360 360' },
  aliases: [],
  docs: 'https://docs.n8n.io/integrations/builtin/trigger-nodes/n8n-nodes-base.stripetrigger/',
  credentialDocs: 'https://docs.n8n.io/integrations/builtin/credentials/stripe/',
  genericResources: [
    {
      label: 'Automate your customer journey with n8n: An interview with Blent.ai',
      icon: '🚀',
      url: 'https://n8n.io/blog/automate-your-customer-journey-with-n8n-an-interview-with-blent-ai/',
    },
  ],
  source: {
    commit: '3d68c29b9281f14097aa9f15e01ac0777e538b11',
    path: 'packages/nodes-base/nodes/Stripe/StripeTrigger.node.ts',
    metadataPath: 'packages/nodes-base/nodes/Stripe/StripeTrigger.node.json',
    helperPaths: [
      'packages/nodes-base/nodes/Stripe/helpers.ts',
      'packages/nodes-base/nodes/Stripe/StripeTriggerHelpers.ts',
      'packages/nodes-base/utils/webhook-signature-verification.ts',
    ],
    credentialPath: 'packages/nodes-base/credentials/StripeApi.credentials.ts',
    iconPath: 'packages/nodes-base/nodes/Stripe/stripe.svg',
  },
  credentialRequirements: [
    {
      type: 'stripeApi',
      name: 'Stripe API',
      required: true,
      inert: true,
      documentationUrl: 'stripe',
      fields: [
        { n8nKey: 'secretKey', label: 'Secret Key', sourceKind: 'string', password: true, required: false },
        { n8nKey: 'signatureSecret', label: 'Signature Secret', sourceKind: 'string', password: true, required: false },
        {
          n8nKey: 'notice',
          label: 'We strongly recommend setting up a signing secret to ensure the authenticity of requests.',
          sourceKind: 'notice',
          showWhen: { signatureSecret: [''] },
        },
      ],
    },
  ],
  webhooks: [
    { name: 'default', httpMethod: 'POST', responseMode: 'onReceived', path: 'webhook', inert: true },
  ],
  params: [
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
      simulationNote: 'Credential discovery, creation, testing, and authentication are intentionally disabled.',
    },
    {
      key: 'events',
      n8nKey: 'events',
      label: 'Events',
      kind: 'multiSelect',
      sourceKind: 'multiOptions',
      value: [],
      required: true,
      options: eventOptions,
      description: 'The event to listen to',
    },
    {
      key: 'apiVersion',
      n8nKey: 'apiVersion',
      label: 'API Version',
      kind: 'text',
      sourceKind: 'string',
      value: '',
      required: false,
      placeholder: '2026-01-28.clover',
      description: 'The API version to use for requests. It controls the format and structure of the incoming event payloads that Stripe sends to your webhook. If empty, Stripe will use the default API version set in your account at the time, which may lead to event processing issues if the API version changes in the future.',
    },
  ],
  sourceCoverage: {
    liveEventCount: 152,
    includesWildcard: true,
    liveOptions: ['apiVersion'],
    credentialTypes: ['stripeApi'],
  },
  platformGaps: [
    'All 152 current Stripe event choices, including the wildcard, are static authoring options.',
    'The API version is stored as text and is never sent to Stripe.',
    'The credential selector is locked; credential editing and testing are outside the Judge settings surface.',
    'Webhook registration, deletion, reception, event filtering, payload handling, and signature verification are not simulated.',
  ],
  unsupportedControls: [
    { n8nKey: 'credentials.stripeApi', sourceType: 'credential selector', behavior: 'locked/inert' },
    { n8nKey: 'webhooks.default', sourceType: 'webhook lifecycle', behavior: 'metadata only' },
  ],
  simulation: {
    configurationOnly: true,
    credentialAccess: false,
    credentialCreation: false,
    credentialTesting: false,
    authentication: false,
    apiCalls: false,
    polling: false,
    webhookRegistration: false,
    webhookDeletion: false,
    webhookReception: false,
    signatureVerification: false,
    network: false,
    runtime: false,
    expressionExecution: false,
    voice: false,
    sideEffects: false,
  },
  output: {},
};

export default stripeTrigger;
