import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Map "mo:core/Map";

actor {
  type Product = {
    name : Text;
    price : Nat;
  };

  module Product {
    public func compare(product1 : Product, product2 : Product) : Order.Order {
      Text.compare(product1.name, product2.name);
    };
  };

  let products = Map.empty<Nat, Product>();

  public type ProductInput = {
    id : Nat;
    name : Text;
    price : Nat;
  };

  public shared ({ caller }) func initialize(productInputs : [ProductInput]) : async () {
    if (products.isEmpty()) {
      for (input in productInputs.values()) {
        let product : Product = {
          name = input.name;
          price = input.price;
        };
        products.add(input.id, product);
      };
    };
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    products.values().toArray().sort();
  };
};
