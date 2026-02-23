module {
  type OldActor = { adminId : ?Principal };
  type NewActor = { adminId : ?Principal; isInitialized : Bool };

  public func run(old : OldActor) : NewActor {
    { old with isInitialized = false };
  };
};
