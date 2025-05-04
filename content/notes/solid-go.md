---
title: "SOLID principles in GO"
tags:
  - go
  - conference
---

**[Conference Link](https://www.youtube.com/watch?v=zzAdEt3xZ1M)**

### Notes:

- **Properties of Bad Code:**
The video discusses negative properties of bad code, such as rigidity (resistance to change), fragility (tendency to break when modified), immobility (difficulty to reuse), complexity (hard to understand), and obscurity (difficult to read and maintain).
- **Single Responsibility Principle:**
This principle suggests that a class should have one reason to change. In other words, a class should be responsible for a single, well-defined task. This principle helps to keep classes focused and maintainable.
- **Open/Closed Principle:**
Software entities should be open for extension but closed for modification. This means that new functionality can be added to a class or module without changing its existing code. This principle is achieved in Go through the use of interfaces and abstract types.
- **Liskov Substitution Principle:**
Two types are substitutable if a caller cannot tell the difference. This means that a subclass should be able to be used interchangeably with its superclass without breaking the program. This principle is implemented in Go through the use of interfaces.
- **Interface Segregation Principle:**
Clients shouldn't depend on methods they don't use. This means that an interface should only define the methods that are necessary for a specific use case. This principle helps to keep interfaces small and focused.
- **Dependency Inversion Principle:**
High-level modules shouldn't depend on low-level modules; both should depend on abstractions. This means that high-level code should not be directly coupled to low-level implementation details. Instead, both should interact through abstract interfaces.
