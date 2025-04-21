# AppSync Lambda API

This project provides a GraphQL API using AWS AppSync and Lambda functions for basic CRUD operations.

## GraphQL Queries and Mutations

### Get Item
```graphql
query GetItem {
  getItem(id: "123") {
    id
    name
    description
    createdAt
    updatedAt
  }
}
```

### List Items
```graphql
query ListItems {
  listItems {
    id
    name
    description
    createdAt
    updatedAt
  }
}
```

### Create Item
```graphql
mutation CreateItem {
  createItem(input: {
    name: "New Item"
    description: "Item description"
  }) {
    id
    name
    description
    createdAt
    updatedAt
  }
}
```

### Update Item
```graphql
mutation UpdateItem {
  updateItem(
    id: "123"
    input: {
      name: "Updated Name"
      description: "Updated description"
    }
  ) {
    id
    name
    description
    createdAt
    updatedAt
  }
}
```

### Delete Item
```graphql
mutation DeleteItem {
  deleteItem(id: "123")
}
```

## Environment Variables

The following environment variables are required and should be stored in AWS Secrets Manager:

- `API_KEY`: API key for external service

## Deployment

1. Create the required secrets in AWS Secrets Manager
2. Deploy the stack:
   ```bash
   # For development
   npm run deploy:dev

   # For production
   npm run deploy:prod
   ```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Lint code
npm run lint

# Watch for changes
npm run watch
``` 