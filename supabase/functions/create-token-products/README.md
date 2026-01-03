# Create Token Products Function

This function creates Stripe products and prices for token packages defined in the database.

## Usage

Call this function to automatically create Stripe products and prices for all active token packages:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/create-token-products \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

Or from the frontend:

```typescript
const { data, error } = await supabase.functions.invoke('create-token-products');
```

## What it does

1. Fetches all active token packages from the database
2. For each package:
   - Creates a Stripe product (or uses existing if found by name)
   - Creates a Stripe price for that product
   - Updates the database with the Stripe price ID

## Token Packages

The function will create products for:
- Small Pack: 30 tokens for $15
- Medium Pack: 100 tokens for $30  
- Large Pack: 200 tokens for $70

## Notes

- Products are created with metadata linking to the database package ID
- If a product with the same name exists, it will be reused
- Prices are created as one-time payments in USD

