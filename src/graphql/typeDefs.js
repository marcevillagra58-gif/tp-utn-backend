/**
 * ============================================================================
 * GRAPHQL/TYPEDEFS.JS — Definición del esquema
 * ============================================================================
 */

export const typeDefs = `#graphql
  type User {
    id: ID!
    username: String!
    email: String!
    role: String!
    avatar: String
    is_blocked: Boolean!
    producer: Producer # Enlace al registro de productor si existe
  }

  type Product {
    id: ID!
    name: String!
    description: String
    imageUrl: String
  }

  type Comment {
    id: ID!
    userId: String!
    username: String!
    text: String!
    createdAt: String!
  }

  type Producer {
    id: ID!
    name: String!
    description: String
    location: String
    phone: String
    email: String
    imageUrl: String
    category: String
    active: Boolean!
    userId: String
    user: User # Enlace al usuario de Supabase
    products: [Product]
    comments: [Comment]
  }

  type Query {
    # Usuarios
    users: [User]
    user(id: ID!): User
    me: User

    # Productores
    producers(category: String, search: String): [Producer]
    producer(id: ID!): Producer
    producerByUserId(userId: ID!): Producer
  }
`;
