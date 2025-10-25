const { gql } = require('apollo-server-express');
const axios = require('axios');

// GraphQL Schema
const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    name: String!
    phone: String
    role: String!
    createdAt: String!
  }

  type Restaurant {
    id: ID!
    name: String!
    description: String
    cuisine: String!
    rating: Float
    address: String!
    isActive: Boolean!
    menu: [MenuItem!]!
  }

  type MenuItem {
    id: ID!
    name: String!
    description: String
    price: Float!
    category: String!
    isAvailable: Boolean!
    restaurantId: ID!
  }

  type Order {
    id: ID!
    userId: ID!
    restaurantId: ID!
    items: [OrderItem!]!
    status: String!
    totalAmount: Float!
    deliveryAddress: String!
    createdAt: String!
    estimatedDeliveryTime: String
  }

  type OrderItem {
    menuItemId: ID!
    quantity: Int!
    price: Float!
    name: String!
  }

  type Payment {
    id: ID!
    orderId: ID!
    amount: Float!
    status: String!
    method: String!
    transactionId: String
    createdAt: String!
  }

  type Delivery {
    id: ID!
    orderId: ID!
    driverId: ID
    status: String!
    pickupTime: String
    deliveryTime: String
    currentLocation: Location
  }

  type Location {
    latitude: Float!
    longitude: Float!
    address: String
  }

  input CreateOrderInput {
    restaurantId: ID!
    items: [OrderItemInput!]!
    deliveryAddress: String!
  }

  input OrderItemInput {
    menuItemId: ID!
    quantity: Int!
  }

  type Query {
    # User queries
    me: User
    
    # Catalog queries
    restaurants: [Restaurant!]!
    restaurant(id: ID!): Restaurant
    menuItems(restaurantId: ID!): [MenuItem!]!
    
    # Order queries
    myOrders: [Order!]!
    order(id: ID!): Order
    
    # Delivery queries
    deliveryStatus(orderId: ID!): Delivery
  }

  type Mutation {
    # Order mutations
    createOrder(input: CreateOrderInput!): Order!
    cancelOrder(orderId: ID!): Order!
    
    # Payment mutations
    processPayment(orderId: ID!, method: String!): Payment!
  }

  type Subscription {
    orderStatusUpdated(orderId: ID!): Order!
    deliveryLocationUpdated(orderId: ID!): Delivery!
  }
`;

// GraphQL Resolvers
const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      
      try {
        const response = await axios.get(
          `${context.services.user}/api/users/profile`,
          {
            headers: { 'x-user-id': context.user.id }
          }
        );
        return response.data;
      } catch (error) {
        throw new Error('Failed to fetch user profile');
      }
    },

    restaurants: async (parent, args, context) => {
      try {
        const response = await axios.get(`${context.services.catalog}/api/catalog/restaurants`);
        return response.data;
      } catch (error) {
        throw new Error('Failed to fetch restaurants');
      }
    },

    restaurant: async (parent, { id }, context) => {
      try {
        const response = await axios.get(`${context.services.catalog}/api/catalog/restaurants/${id}`);
        return response.data;
      } catch (error) {
        throw new Error('Failed to fetch restaurant');
      }
    },

    menuItems: async (parent, { restaurantId }, context) => {
      try {
        const response = await axios.get(
          `${context.services.catalog}/api/catalog/restaurants/${restaurantId}/menu`
        );
        return response.data;
      } catch (error) {
        throw new Error('Failed to fetch menu items');
      }
    },

    myOrders: async (parent, args, context) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      
      try {
        const response = await axios.get(
          `${context.services.order}/api/orders`,
          {
            headers: { 'x-user-id': context.user.id }
          }
        );
        return response.data;
      } catch (error) {
        throw new Error('Failed to fetch orders');
      }
    },

    order: async (parent, { id }, context) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      
      try {
        const response = await axios.get(
          `${context.services.order}/api/orders/${id}`,
          {
            headers: { 'x-user-id': context.user.id }
          }
        );
        return response.data;
      } catch (error) {
        throw new Error('Failed to fetch order');
      }
    },

    deliveryStatus: async (parent, { orderId }, context) => {
      try {
        const response = await axios.get(
          `${context.services.delivery}/api/delivery/order/${orderId}/status`
        );
        return response.data;
      } catch (error) {
        throw new Error('Failed to fetch delivery status');
      }
    }
  },

  Mutation: {
    createOrder: async (parent, { input }, context) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      
      try {
        const response = await axios.post(
          `${context.services.order}/api/orders`,
          input,
          {
            headers: { 'x-user-id': context.user.id }
          }
        );
        return response.data;
      } catch (error) {
        throw new Error('Failed to create order');
      }
    },

    cancelOrder: async (parent, { orderId }, context) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      
      try {
        const response = await axios.put(
          `${context.services.order}/api/orders/${orderId}/cancel`,
          {},
          {
            headers: { 'x-user-id': context.user.id }
          }
        );
        return response.data;
      } catch (error) {
        throw new Error('Failed to cancel order');
      }
    },

    processPayment: async (parent, { orderId, method }, context) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      
      try {
        const response = await axios.post(
          `${context.services.payment}/api/payments/process`,
          { orderId, method },
          {
            headers: { 'x-user-id': context.user.id }
          }
        );
        return response.data;
      } catch (error) {
        throw new Error('Failed to process payment');
      }
    }
  },

  // Nested resolvers
  Restaurant: {
    menu: async (parent, args, context) => {
      try {
        const response = await axios.get(
          `${context.services.catalog}/api/catalog/restaurants/${parent.id}/menu`
        );
        return response.data;
      } catch (error) {
        return [];
      }
    }
  }
};

module.exports = { typeDefs, resolvers };