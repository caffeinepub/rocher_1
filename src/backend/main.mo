import Map "mo:core/Map";
import Text "mo:core/Text";



actor {
  let store = Map.empty<Text, Text>();
  let adminPassword = "rocher2024";

  public query ({ caller }) func getValue(key : Text) : async Text {
    switch (store.get(key)) {
      case (?value) { value };
      case (null) { "" };
    };
  };

  public shared ({ caller }) func setValue(key : Text, value : Text, password : Text) : async Bool {
    if (Text.equal(password, adminPassword)) {
      store.add(key, value);
      true;
    } else {
      false;
    };
  };

  public shared ({ caller }) func appendToValue(key : Text, newEntry : Text) : async Bool {
    let existing = switch (store.get(key)) {
      case (?value) { value };
      case (null) { "" };
    };

    let updated = if (existing.size() == 0 or existing == "[]") {
      "[ " # newEntry # " ]";
    } else {
      let trimmed = existing.trimEnd(#char ']');
      trimmed # ", " # newEntry # " ]";
    };

    store.add(key, updated);
    true;
  };
};

