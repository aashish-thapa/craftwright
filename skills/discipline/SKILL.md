---
name: discipline
description: Senior-engineer discipline for AI coding agents — SOLID, DRY, separation of concerns, composition root, illegal-states-unrepresentable, plus process rules for commits, comments, scope, and verification. Load on every coding task (read, write, review, refactor) across any language or project type.
---

# craftwright — code discipline

This skill is always relevant for any coding task — reading, writing, reviewing, or refactoring code in any language or framework. Good code is not a matter of taste; it follows from disciplined application of a small set of well-understood system design principles. Apply these principles continuously while writing code, not as a final polish step.

## Part I — System design principles

### Single Responsibility Principle (SRP)

- **Definition:** A module, class, or function has exactly one reason to change.
- **Why:** When a unit serves two masters, changes for one concern destabilize the other and tests for one drag in setup for the other.
- **How to apply:**
  - Describe the unit's purpose in one sentence. If you need "and", split it.
  - Group by reason-to-change (the user, the persistence layer, the protocol), not by surface similarity.
  - A 300-line class doing five things is five classes wearing one name.
- **Anti-example:**

```python
class UserService:
    def create_user(self, payload): ...
    def send_welcome_email(self, user): ...
    def render_profile_html(self, user): ...
    def export_users_to_csv(self): ...
```

- **Example:**

```python
class UserRepository:
    def create(self, payload) -> User: ...

class WelcomeMailer:
    def send(self, user: User) -> None: ...

class ProfileRenderer:
    def render(self, user: User) -> str: ...
```

- **See also:** §Separation of Concerns, §High Cohesion, Low Coupling

---

### Open/Closed Principle (OCP)

- **Definition:** Code is open for extension but closed for modification — new behavior arrives via new code, not edits to existing code.
- **Why:** Every edit to working code risks regression in unrelated paths; a switch statement that grows on every feature is a magnet for bugs.
- **How to apply:**
  - Identify the axis of variation. Place a seam (Protocol, ABC, function table) at that axis.
  - New variants land as new files implementing the seam; the dispatching code never changes.
  - If you are editing the same `match` / `switch` / `if-elif` chain on every feature, you missed a polymorphism seam.
- **Anti-example:**

```python
def area(shape):
    if shape.kind == "circle":
        return 3.14 * shape.r ** 2
    elif shape.kind == "square":
        return shape.side ** 2
    elif shape.kind == "triangle":
        return 0.5 * shape.base * shape.height
```

- **Example:**

```python
class Shape(Protocol):
    def area(self) -> float: ...

class Circle:
    def __init__(self, r): self.r = r
    def area(self): return 3.14 * self.r ** 2

class Square:
    def __init__(self, side): self.side = side
    def area(self): return self.side ** 2
```

- **See also:** §Dependency Inversion, §Composition over Inheritance

---

### Liskov Substitution Principle (LSP)

- **Definition:** A subtype must be usable anywhere its base type is used, without surprises.
- **Why:** A subtype that strengthens preconditions, weakens postconditions, or throws unexpected exceptions breaks every caller that holds a reference to the base.
- **How to apply:**
  - Subtypes accept everything the base accepts (preconditions no stronger).
  - Subtypes return what the base promises (postconditions no weaker).
  - Subtypes do not raise exceptions outside the base contract.
  - If a subclass overrides a method to `raise NotImplementedError` or to silently no-op, the hierarchy is wrong — that subclass does not belong under that base.
- **Anti-example:**

```python
class Bird:
    def fly(self, distance_m: float) -> None: ...

class Ostrich(Bird):
    def fly(self, distance_m):
        raise NotImplementedError("ostriches do not fly")
```

- **Example:**

```python
class Bird(Protocol):
    def move(self, distance_m: float) -> None: ...

class Sparrow:
    def move(self, distance_m): self._fly(distance_m)

class Ostrich:
    def move(self, distance_m): self._run(distance_m)
```

- **See also:** §Composition over Inheritance, §Interface Segregation

---

### Interface Segregation Principle (ISP)

- **Definition:** Many small, focused interfaces beat one large interface.
- **Why:** A consumer that depends on methods it never calls is coupled to changes in those methods for no benefit.
- **How to apply:**
  - One interface per role. A class may implement several.
  - If most implementers stub half the methods, the interface is two interfaces glued together.
  - Name interfaces by the role they play in the call site (`Readable`, `Closable`, `Renderable`), not by their implementation.
- **Anti-example:**

```python
class Worker(Protocol):
    def work(self) -> None: ...
    def eat(self) -> None: ...
    def sleep(self) -> None: ...

class Robot:
    def work(self): ...
    def eat(self): raise NotImplementedError
    def sleep(self): raise NotImplementedError
```

- **Example:**

```python
class Workable(Protocol):
    def work(self) -> None: ...

class Feedable(Protocol):
    def eat(self) -> None: ...

class Human:
    def work(self): ...
    def eat(self): ...

class Robot:
    def work(self): ...
```

- **See also:** §Single Responsibility, §Liskov Substitution

---

### Dependency Inversion Principle (DIP)

- **Definition:** High-level policy depends on abstractions; low-level details also depend on abstractions. Dependency direction flows from concrete details toward abstract policy, never the reverse.
- **Why:** When policy imports detail, you cannot test policy in isolation, you cannot swap the detail, and a change in the detail forces a rebuild of policy.
- **How to apply:**
  - Type annotations for fields, parameters, and factory return types reference a Protocol (or other abstract type), not a concrete class — unless the dependency is intrinsically tied to the implementation (e.g. a runner reference inside an adapter whose whole job is to bind to that runner).
  - The composition root (DI providers / factories) is the only place concrete types appear. See §Composition Root.
  - Naming pattern: Protocol gets the bare noun (`FrameBuilder`, `AudioExtractor`); impl encodes the strategy (`StagedFrameBuilder`, `GstAudioExtractor`).
  - Write the Protocol FIRST, then the implementation. Do not bolt on abstraction later as cleanup — by then the call sites have already learned the wrong shape.
- **Anti-example:**

```python
from db.postgres_client import PostgresClient

class OrderService:
    def __init__(self):
        self.db = PostgresClient(host="...", port=5432)

    def place(self, order):
        self.db.insert("orders", order)
```

- **Example:**

```python
class OrderStore(Protocol):
    def insert(self, order: Order) -> None: ...

class OrderService:
    def __init__(self, store: OrderStore):
        self.store = store

    def place(self, order: Order) -> None:
        self.store.insert(order)
```

- **See also:** §Composition Root, §Open/Closed, §Stable Dependencies

---

### DRY — Don't Repeat Yourself

- **Definition:** Every piece of **knowledge** has one authoritative representation in the system.
- **Why:** Duplicated knowledge drifts; consumers that read different copies will eventually disagree, and the bug is hard to trace.
- **How to apply:**
  - The duplication that matters is duplicated knowledge — a constant, a schema, a business rule — not duplicated text.
  - Two functions that look alike but change for different reasons are not a DRY violation; consolidating them creates coupling between unrelated concerns.
  - Constants, validation rules, and serialization shapes get one home. Reach for it; do not restate it.
- **Anti-example:**

```python
def is_premium_user(u): return u.plan_tier >= 3
def discount_for(u): return 0.2 if u.plan_tier >= 3 else 0.0
def can_see_beta(u): return u.plan_tier >= 3
```

- **Example:**

```python
PREMIUM_TIER = 3

def is_premium(u): return u.plan_tier >= PREMIUM_TIER
def discount_for(u): return 0.2 if is_premium(u) else 0.0
def can_see_beta(u): return is_premium(u)
```

- **See also:** §Encapsulation, §Single Responsibility

---

### Separation of Concerns

- **Definition:** Different aspects of the system live in different modules — persistence is not business logic, transport is not domain, rendering is not data fetching.
- **Why:** When concerns mix, every change ripples across boundaries: a database column rename rewrites HTTP handlers, a UI tweak edits SQL.
- **How to apply:**
  - One responsibility per module, described in one sentence without "and".
  - Domain types know nothing of HTTP, SQL, or file paths.
  - Adapters translate between domain types and external shapes; they do not contain business rules.
- **Anti-example:**

```python
@app.post("/orders")
def create_order(req):
    body = json.loads(req.body)
    if body["qty"] <= 0:
        return Response(400, "bad qty")
    total = body["qty"] * body["price"] * 1.08
    db.execute("INSERT INTO orders ...", body["qty"], total)
    return Response(200, render_template("order.html", total=total))
```

- **Example:**

```python
@app.post("/orders")
def create_order(req):
    cmd = parse_create_order(req.body)
    order = order_service.place(cmd)
    return json_response(order_view(order))
```

- **See also:** §Single Responsibility, §Domain-Driven Module Organization

---

### Composition over Inheritance

- **Definition:** Assemble behavior from small, composed parts rather than inheriting from deep class hierarchies.
- **Why:** Inheritance forces a single axis of variation and freezes it at class-definition time; composition allows multiple independent axes, swappable at runtime.
- **How to apply:**
  - Default to composition. Reach for inheritance only when there is a genuine "is-a" relationship AND substitutability (§LSP) holds.
  - Prefer "has-a" + delegate over "is-a" + override.
  - Mix-ins and trait-like designs that pile on capabilities tend to grow into the same problems as deep hierarchies.
- **Anti-example:**

```python
class Animal:
    def move(self): ...
class Swimmer(Animal):
    def move(self): self._swim()
class FlyingSwimmer(Swimmer):
    def move(self): self._fly_or_swim()
class FlyingSwimmingWalker(FlyingSwimmer): ...
```

- **Example:**

```python
class Mover(Protocol):
    def move(self) -> None: ...

class Animal:
    def __init__(self, movers: list[Mover]):
        self.movers = movers
    def move(self):
        for m in self.movers: m.move()
```

- **See also:** §Liskov Substitution, §Open/Closed

---

### High Cohesion, Low Coupling

- **Definition:** Things that change together live together (cohesion); things that don't depend on each other don't import each other (coupling).
- **Why:** Low cohesion forces edits to span many files for one logical change; high coupling means one file's edit forces edits in unrelated files.
- **How to apply:**
  - Sniff test: if changing one file regularly forces edits in five distant files, coupling is too high.
  - Sniff test: if one file mixes UI, transport, persistence, and business logic, cohesion is too low.
  - Increase cohesion by moving related code together; decrease coupling by introducing seams (Protocols) at the joints.
  - These are two sides of the same coin — improving one usually improves the other.
- **Anti-example:**

```python
# utils.py — grab bag, no theme
def format_price(p): ...
def parse_jwt(token): ...
def resize_image(img, w, h): ...
def send_slack(msg): ...
```

- **Example:**

```python
# pricing/format.py
def format_price(p): ...

# auth/jwt.py
def parse_jwt(token): ...

# images/resize.py
def resize_image(img, w, h): ...

# notify/slack.py
def send_slack(msg): ...
```

- **See also:** §Separation of Concerns, §Domain-Driven Module Organization

---

### Encapsulation / Information Hiding

- **Definition:** A module's public surface exposes what it does; internals are hidden so they can change freely.
- **Why:** Every internal detail exposed becomes a de facto part of the contract; consumers will depend on it and break when it changes.
- **How to apply:**
  - Hide volatile decisions (storage format, third-party library choices, threading model) behind stable interfaces.
  - The fewer concepts a consumer must understand to use a module, the better.
  - Public state without invariants is a bug waiting to happen — if a field can be mutated into an inconsistent state from outside, encapsulate it.
- **Anti-example:**

```python
class Account:
    balance: float  # callers freely mutate balance
    transactions: list

a = Account()
a.balance = -50_000   # nothing stops this
a.transactions.append("forged entry")
```

- **Example:**

```python
class Account:
    def __init__(self):
        self._balance = 0.0
        self._transactions: list[Tx] = []

    @property
    def balance(self) -> float: return self._balance

    def withdraw(self, amount: float) -> None:
        if amount > self._balance:
            raise InsufficientFunds()
        self._balance -= amount
        self._transactions.append(Tx.withdraw(amount))
```

- **See also:** §Make Illegal States Unrepresentable, §Tell, Don't Ask

---

### Visibility markers match reach, not authorship

- **Definition:** A leading underscore (Python `_name`), `private`, `internal`, `pub(crate)`, `#field` — every language's "not public" marker makes the same claim: *this name is not part of the surface consumers outside the defining boundary may reference*. Attaching that marker to a name a consumer must import, annotate against, subclass, or `isinstance`-check is a category error. A type is either usable across the boundary or it isn't; there is no third state where it's "usable but privately".
- **Why:** A "private" name the caller has to reference isn't private — the marker just lies about the contract. Consumers either violate the convention on every use (`from pkg import _Profile`) or wrap it in a re-export that duplicates the surface. Both teach the reader to distrust the language's own visibility signals. The marker becomes noise, and real internals lose the one signal that would have protected them.
- **How to apply:**
  - **Underscore is a boundary signal, not a "I haven't decided where this goes" fig leaf.** Apply it only when nothing outside the defining module references the name.
  - **Types, classes, enums, dataclasses, exceptions, Protocols** that appear in another module's parameter, return type, field annotation, import, subclass, or `isinstance` check — drop the underscore. If it lives on the public surface, name it publicly.
  - **Reserve underscore for genuine internals:** module-local helpers, module-private constants, private instance state (`self._buffer`), the concrete class hidden behind a public factory that returns the Protocol.
  - **Modules follow the same rule.** `_foo.py` is fine only when nothing about `foo`'s public surface mentions the names inside it. If its classes leak out through a re-export, a return type, or a `from pkg._foo import ...` in a sibling package, promote it to `foo.py` and give it a real home. See §Domain-Driven Module Organization.
  - **Protocols cannot have private methods.** A Protocol *is* the public contract; a `_method` on it is either public behavior (rename) or belongs on the concrete implementation, not the abstraction.
  - **Test:** grep for the underscore-prefixed name from outside the defining module. Any hit is either a rename or a real encapsulation bug.
- **Anti-example:**

```python
# devices/_profile.py
class _Profile:
    name: str
    tier: int

# devices/__init__.py
from ._profile import _Profile   # re-exporting a "private" name is the tell

# billing/service.py
from devices import _Profile              # caller reaches into a "private" name
def price_for(p: _Profile) -> Money: ...  # ...and writes `_Profile` in its own signature
```

- **Example:**

```python
# devices/profile.py
class Profile:
    name: str
    tier: int

# billing/service.py
from devices import Profile
def price_for(p: Profile) -> Money: ...
```

- **See also:** §Encapsulation, §Domain-Driven Module Organization, §Dependency Inversion

---

### Tell, Don't Ask / Law of Demeter

- **Definition:** Tell objects what to do; do not ask them for state and act on it externally. A method talks only to its own fields, its parameters, objects it creates, and direct collaborators.
- **Why:** Reaching through someone else's structure couples you to that structure; their refactor breaks your code.
- **How to apply:**
  - `order.customer.address.zip` is a smell — the caller knows three layers of someone else's shape.
  - Push the behavior into the owner of the data: `order.shipping_zip()`.
  - One dot per reach is a useful default; more than one wants a method on the receiver.
- **Anti-example:**

```python
def ship(order):
    if order.customer.address.country == "US":
        rate = order.customer.account.shipping_table.us_rate
        return rate * order.items.total_weight()
```

- **Example:**

```python
def ship(order):
    return order.shipping_cost()

class Order:
    def shipping_cost(self) -> Money:
        return self.customer.shipping_cost_for(self.weight())
```

- **See also:** §Encapsulation, §High Cohesion, Low Coupling

---

### Composition Root pattern

- **Definition:** One module per application wires concrete types together; every other module receives its dependencies via constructor or factory injection.
- **Why:** Centralizing the wiring graph means swapping implementations, mocking for tests, and reasoning about lifetimes all happen in one place — not scattered across hundreds of `new` calls.
- **How to apply:**
  - Name it consistently: `dependencies.py`, `container.py`, `providers.py`, or `app.py` (top-level entrypoint).
  - The composition root is the ONLY place that imports concrete implementations of swappable types.
  - Everything else imports Protocols and receives concretes through its constructor.
  - Tests construct their own miniature composition root with fakes — the production code does not branch on "test mode".
- **Anti-example:**

```python
# scattered through the codebase
from db.postgres_client import PostgresClient
from mail.ses_sender import SesSender

class OrderService:
    def __init__(self):
        self.db = PostgresClient(...)
        self.mail = SesSender(...)
```

- **Example:**

```python
# orders/service.py — no concrete imports
class OrderService:
    def __init__(self, store: OrderStore, mailer: Mailer): ...

# app/dependencies.py — the ONLY place concretes are wired
def build_order_service() -> OrderService:
    return OrderService(
        store=PostgresOrderStore(get_pg_pool()),
        mailer=SesMailer(get_ses_client()),
    )
```

- **See also:** §Dependency Inversion, §Stable Dependencies

---

### Domain-Driven Module Organization

- **Definition:** Group code by domain concept, not by technical type.
- **Why:** Technical-type packaging (`controllers/`, `models/`, `services/`) scatters one feature across the tree; a single change touches every directory.
- **How to apply:**
  - A package directory contains only files about its domain.
  - If `pipeline/` accumulates `_gst_audio.py`, `_pil_color.py`, `_image_ops.py`, those signal misplaced files. GStreamer adapters belong in `gst/`, image ops in `image/`, video ops in `video/`. Move them.
  - Underscore-prefixed modules signal "private to this package's internals." When a module is consumed across packages or has its own coherent identity, drop the underscore and give it a real home. Do not keep `_foo.py` around as a fig leaf for "I didn't decide where this belongs."
  - The directory tree should read like a table of contents of the problem domain.
- **Anti-example:**

```
src/
  controllers/      # billing, auth, search all mixed
  models/           # billing, auth, search all mixed
  services/         # billing, auth, search all mixed
  utils/            # grab bag
```

- **Example:**

```
src/
  billing/          # routes, domain, store, adapters
  auth/             # routes, domain, store, adapters
  search/           # routes, domain, store, adapters
  shared/           # genuinely cross-cutting primitives only
```

- **See also:** §High Cohesion, Low Coupling, §Separation of Concerns

---

### Make Illegal States Unrepresentable

- **Definition:** Use the type system to rule out invalid combinations of fields and lifecycle states.
- **Why:** Invariants enforced by comments rot; invariants enforced by constructors and types cannot be violated without a deliberate workaround.
- **How to apply:**
  - Prefer sum types / tagged unions over `if some_flag and other_flag and not third_flag`.
  - Prefer required-at-construction over `set_x()` followed by `set_y()` where forgetting one breaks the object.
  - The best invariant is one the type-checker enforces; the second best is one a constructor enforces; the worst is one a comment claims.
  - "Parse, don't validate" — convert raw input to a type that, by existing, proves the invariant.
- **Anti-example:**

```python
class Connection:
    host: str | None = None
    port: int | None = None
    is_open: bool = False
    socket: Socket | None = None
    # caller must remember: set host+port, then open(), then use socket
```

- **Example:**

```python
@dataclass(frozen=True)
class ConnectionParams:
    host: str
    port: int

class OpenConnection:
    def __init__(self, params: ConnectionParams):
        self._socket = Socket.connect(params.host, params.port)

    def send(self, data: bytes) -> None:
        self._socket.send(data)
```

- **See also:** §Encapsulation, §Validate at boundaries

---

### Validate at boundaries, trust inside

- **Definition:** External input is suspect and gets validated aggressively at the boundary; once converted to internal types, trust them.
- **Why:** Defensive checks scattered through internal code obscure the logic, slow execution, and signal that the type system is not being used to its potential.
- **How to apply:**
  - Boundaries to validate: HTTP payloads, IPC messages, file reads, user input, database results, third-party API responses.
  - Convert raw input to a domain type at the boundary. Inside, the type carries the proof.
  - Do not pepper internal code with null checks, defensive guards, or "just in case" exception handling for scenarios that cannot occur given internal invariants.
- **Anti-example:**

```python
def calculate_total(order):
    if order is None: return 0
    if not hasattr(order, "items"): return 0
    if order.items is None: return 0
    total = 0
    for item in order.items:
        if item is None: continue
        if item.price is None: continue
        total += item.price
    return total
```

- **Example:**

```python
def parse_order(payload: dict) -> Order:
    # validate once, here
    return Order(items=[Item(price=Money(x["price"])) for x in payload["items"]])

def calculate_total(order: Order) -> Money:
    return sum((i.price for i in order.items), start=Money.zero())
```

- **See also:** §Make Illegal States Unrepresentable, §Encapsulation

---

### Stable Dependencies Principle

- **Definition:** Modules depend in the direction of stability — volatile modules depend on stable ones, never the reverse.
- **Why:** A stable module that imports from a volatile one inherits its instability; every change in the volatile module forces a re-validation of the stable one.
- **How to apply:**
  - Stable: domain models, core interfaces, primitive shared types.
  - Volatile: UI, transport details, third-party adapters, configuration.
  - When you see a stable module importing from a volatile one, the dependency is upside-down. Invert it via a Protocol owned by the stable side.
  - Direction check: open the import graph. Arrows should point from outer layers (volatile) toward the core (stable).
- **Anti-example:**

```python
# domain/order.py  (should be stable)
from web.api.serializers import OrderSchema  # volatile dependency

class Order:
    def to_api(self) -> dict:
        return OrderSchema().dump(self)
```

- **Example:**

```python
# domain/order.py
class Order:
    id: OrderId
    items: list[Item]

# web/api/serializers.py
from domain.order import Order  # volatile depends on stable
class OrderSchema(Schema): ...
```

- **See also:** §Dependency Inversion, §Composition Root

---

## Part II — Code-discipline practices

These are the day-to-day habits that operationalize Part I.

### Commits

- One concern per commit. Format: `type(scope): subject`. Lowercase, no trailing period, under 72 chars.
- Allowed types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `build`, `ci`, `style`.
- Never reference PR numbers, reviewer names, or phrases like "addresses review feedback", "per code review", "as discussed". Commits stand on their own across history.
- **Never** add `Co-Authored-By: Claude …` or any AI-attribution footer. Strip it from every commit, every repo, even if previous commits had it.
- Default to subject only unless the user explicitly asks for a body. When a body is requested, wrap at 72 chars and explain *why*, not *what*.
- If two concerns are genuinely entangled in the diff (e.g. a refactor that moves files containing new feature code introduced in the same session), name both concerns in the subject — `feat(x): add Y and split Z into subpackages` — rather than ship a broken intermediate commit. Do not fake a clean split if the code does not separate without diff-engineering.
- Stage by file or hunk; never `git add -A` without checking what is in the worktree.

**Bad:**

```
Updated user service per PR #432 feedback from @reviewer

- fixed the thing
- also added some tests
- co-authored-by: Claude
```

**Good:**

```
fix(user): reject empty email at registration boundary
```

---

### Comments and docstrings

- Default: no comment. Add one only when the **why** is non-obvious: a hidden constraint, a workaround for a specific bug, a subtle invariant, behavior that would surprise a future reader.
- Never reference the current task, PR, fix, or who asked for it. No "added for X flow", "used by Y", "fixes issue #123". That belongs in commit messages or PR descriptions, not the code.
- Docstrings: one line of purpose for the module, class, public function, or non-obvious attribute. Multi-paragraph docstrings only when the contract is genuinely complex (rare).
- **Forbidden in docstrings:** "DI-injected", "test fixture for", "added during refactor", "this is the X seam for Y", any reference to architecture decisions or implementation history. Docstrings state **what it's for**, not how it got there.
- Attribute docstrings only when the field's role isn't obvious from name + type. Trivial fields get no docstring.
- If a comment explains what the code does, rename the code instead.

**Bad:**

```python
class FrameBuilder:
    """DI-injected frame builder added during the v2 refactor.

    Used by VideoPipeline (see PR #812). This is the seam for swapping
    GPU vs CPU rendering — see ADR-017.
    """
    # increment counter (added for issue #459)
    counter: int
```

**Good:**

```python
class FrameBuilder:
    """Assembles frames from a sequence of layers."""

    counter: int
```

---

### Naming as documentation

- A well-named identifier removes the need for a comment. If you reach for a comment to explain what a name means, fix the name first.
- Full words: `event_emitter` not `emt`, `cancel_scope` not `cs`, `request` not `req`.
- Booleans read as questions: `is_ready`, `has_audio`, `should_retry`, `can_publish`.
- Verbs for actions, nouns for things. `compute_total()` returns a value; `total` is a value.
- Match the level of abstraction to the layer. Domain code uses domain words (`Order`, `Invoice`); adapters use the language of their target (`PostgresOrderRow`).
- A name that needs a qualifier (`real_user`, `actual_count`, `proper_id`) is a sign two concepts share one word — rename one of them.

**Bad:**

```python
def proc(d, f):
    r = []
    for x in d:
        if f(x): r.append(x)
    return r
```

**Good:**

```python
def filter_orders(orders: list[Order], predicate: Predicate[Order]) -> list[Order]:
    return [o for o in orders if predicate(o)]
```

---

### Never in production code

The following patterns look harmless in a script or a test, and are actively dangerous in production. AI coding agents ship them constantly. Reject them on sight.

**`assert` for runtime validation**

- Python's `-O` flag strips every `assert` statement. Anything you "validated" via `assert` is unchecked in production.
- `assert` belongs in tests and in debug-build-only sanity checks. It is *not* a validation primitive.
- For real runtime validation, raise the specific exception:

  ```python
  # WRONG — vanishes under python -O
  def transfer(amount: Decimal, account: Account) -> None:
      assert amount > 0, "amount must be positive"

  # RIGHT — checked in every build
  def transfer(amount: Decimal, account: Account) -> None:
      if amount <= 0:
          raise ValueError("amount must be positive")
  ```

**Debugging leftovers**

- `print(...)` / `console.log(...)` as logging. Structured logger only (`logging`, `structlog`, `logfire`, `pino`, `tracing`).
- `breakpoint()`, `pdb.set_trace()`, `debugger;`, `binding.pry` — remove before commit.
- Commented-out code. Delete it. `git log` remembers.

**Broad exception catching**

- `except:` catches `SystemExit`, `KeyboardInterrupt`, `GeneratorExit`. The runtime can no longer shut down cleanly.
- `except Exception: pass` silently swallows bugs. Failures become invisible.
- Correct pattern: catch the specific exception you can handle; re-raise the rest preserving cause:

  ```python
  try:
      order = repo.get(order_id)
  except OrderNotFound:
      return None
  except Exception as e:
      logger.exception("unexpected error loading order", order_id=order_id)
      raise
  ```

**Hardcoded secrets / config**

- API keys, tokens, connection strings, JWT secrets in source. Ever. Not even "temporarily."
- Read from a settings model (`pydantic_settings.BaseSettings`, `envalid`, `viper`), with values sourced from environment or a secrets manager.
- Magic numbers that look behavioral (timeouts, retry counts, batch sizes, feature thresholds): named constants at minimum, `Settings` model if per-environment tuning is plausible.

**Blocking I/O inside async code**

- `time.sleep(x)` inside `async def` → `await asyncio.sleep(x)` or `await anyio.sleep(x)`. `time.sleep` freezes the entire event loop for every other coroutine.
- `requests.get(...)`, `psycopg2.connect(...)`, `open(path).read()` inside `async def` → the async equivalents (`httpx.AsyncClient`, `asyncpg`, `anyio.Path`).
- Any sync file / network / DB call in a coroutine blocks the loop.

**Fire-and-forget async tasks**

- `asyncio.create_task(coro)` without holding the reference. The task can be garbage collected mid-flight and disappear silently.
- Correct: keep the reference in a set, or use `anyio.create_task_group()` (or `asyncio.TaskGroup` in 3.11+) for scoped lifecycle with proper exception propagation.

**Retry without safeguards**

- Retry loop with no max attempts → infinite spin under permanent failure.
- Retry loop with no backoff → hammers the failing service, gets you rate-limited or banned.
- Retry loop with no jitter → thundering herd when N clients recover at the same tick.
- Retrying on non-retryable errors (401, 403, 400) is a bug, not a fix.
- Use a battle-tested library (`tenacity`, `stamina`, `backoff`) rather than rolling your own.

**Floating-point money**

- `float` for prices, balances, invoice totals, taxes. `0.1 + 0.2 != 0.3`, and it propagates.
- Use `Decimal` with an explicit context, or integer minor units (cents / paise / pence).
- `a == b` on floats is generally broken — use `math.isclose(a, b, rel_tol=..., abs_tol=...)`.

**Naïve datetime**

- `datetime.now()` / `datetime.utcnow()` / `new Date()` without timezone. Meaning depends on machine local zone, drifts under DST, breaks across regions.
- Store UTC (`datetime.now(tz=UTC)`), convert for display only.
- `datetime.utcnow()` in particular is deprecated in Python 3.12+ because it returns a *naive* datetime with UTC values — footgun.

**String-interpolated SQL / shell**

- `f"SELECT * FROM users WHERE id = {user_id}"` — SQL injection.
- `subprocess.run(cmd, shell=True)` with user-influenced input — shell injection.
- `os.system(cmd)` at all when `subprocess.run(argv_list, shell=False, check=True)` works.
- Parameterize queries. Split shell commands into argv lists. Never pass user input through a shell parser.

**Unsafe deserialization**

- `pickle.loads(untrusted_bytes)` → arbitrary code execution.
- `yaml.load(untrusted)` → arbitrary code execution. Use `yaml.safe_load`.
- `eval()`, `exec()` on any external string — same.
- If pickle / `yaml.load` / `eval` is reachable from outside, redesign.

**Debug flags in production**

- `debug=True` in Flask / Django / FastAPI. Verbose stack traces returned to the client is a data leak.
- Development-only routes (`/debug/`, `/_test/`) not gated by environment.
- Fixture / seed loading called at production import time.

**Global mutable state**

- Module-level mutable containers (`_cache = {}`, `_registry = []`) mutated by every request → race conditions under concurrency, unclean state across restarts.
- Prefer per-request state, or explicit thread-safe / async-safe primitives.
- Singletons that carry mutable state hide dependencies and defeat testing.

**Logging sensitive data**

- `log.info(f"login attempt: {request_body}")` when the body contains password, token, PII.
- Redact before logging, or log a stable fingerprint (`sha256(token)[:8]`).
- Structured logging + a redaction pass at the formatter is stronger than trusting every call site.

**Silent type coercion**

- `if value:` when `value` might legitimately be `0`, `""`, or `[]`. Use `if value is not None:` when that's what you mean.
- `int(user_input)` without validation → `ValueError` bubbles up as a 500.
- Implicit boolean context on domain objects (`if user:` where `user` is a `User`) is ambiguous — say what you mean.

**Working-directory / import-time surprises**

- Reading a file at import time (`config = open("config.yaml").read()` at module top level). Import order becomes correctness. CWD becomes correctness.
- Expensive computation at import time (compiling large regexes, loading models). Slows every process start, breaks tooling that imports for introspection.
- `sys.exit()` from inside a library — you don't own the process.

**See also:** §Validate at boundaries — most of these are "you didn't validate at the boundary." §Encapsulation — most of the rest are "you exposed mutable state that shouldn't be reachable." §Make Illegal States Unrepresentable — many production bugs are invariants encoded as `assert` rather than as types.

---

### Verify external-tool config from source

- Never propose config flags, env vars, schema fields, or CLI arguments for an external tool (linter, build system, library, framework) from memory or training. Check the **pinned version's** schema, source, or `--help` output first.
- If the project uses pyproject.toml, package.json, Cargo.toml, go.mod — read it to find the version before recommending knobs.
- If you cannot verify a knob exists at the version in use, say "I'd need to check X's docs at <version>" and either fetch them or ask.
- This applies to:
  - CLI flags (`ruff --select`, `cargo --features`, `kubectl --field-selector`).
  - Config keys (eslint, prettier, tsconfig, pyproject sections).
  - API surface of libraries (method signatures, return shapes, deprecated symbols).
  - Schema fields for declarative configs (CI yaml, Dockerfile directives).
- Training data ages. Pinned versions do not.

---

### Research prior art before designing

Before designing anything non-trivial — an architecture, a protocol, a data model, a tricky algorithm, a state machine, a concurrency pattern — search for how the wider engineering community has already solved this class of problem. Read what experienced developers have published. Compare approaches. Only then propose a design.

This applies equally to:

- **Architecture decisions** (event sourcing vs. CRUD, choreography vs. orchestration, monolith decomposition, sync vs. async boundaries).
- **Protocol design** (wire formats, retry semantics, idempotency keys, leader election, consensus, versioning strategies).
- **Library/tool selection** when there is a real choice between options — not when it is already dictated.
- **Algorithm or data-structure choice** for non-obvious problems.
- **Failure-mode handling** (backpressure, circuit breakers, partial failure, supervision trees).

**How to apply:**

- Use the web search tool. Search for the **problem shape**, not the specific symptom — "idempotent message processing pattern", "live mask wire protocol stencil", "perspective warp cornerpin algorithm", not "how do I fix my code".
- Look for: established patterns with names, well-known papers, mature library implementations, postmortems and lessons-learned writeups. A pattern with a name and a Wikipedia entry has likely been beaten on for a decade.
- Bring back **at least two distinct approaches** when there is real design space. Summarize the tradeoffs (latency, complexity, failure modes, operational cost) and recommend one with reasoning.
- Do not reinvent in the small. If the problem has a textbook name (debouncing, rate limiting, exponential backoff, two-phase commit, CRDT merge, work stealing), use the textbook solution unless you can articulate why this case needs something different.

**Anti-example:**

> User: "We need to broadcast UI state to multiple devices in sync."
> Agent: *jumps straight to designing a custom WebSocket fanout with timestamp negotiation.*

**Example:**

> User: "We need to broadcast UI state to multiple devices in sync."
> Agent: *searches for "multi-device state synchronization patterns" and returns with a comparison of CRDTs for last-write-wins state, operational transform for collaborative editing, server-authoritative broadcast for ephemeral state, and Raft for strong consistency. Recommends server-authoritative broadcast for this use case (ephemeral, single source of truth, no offline edits) and explains why the others would be overengineering.*

**When NOT to research:**

- Tiny mechanical edits (rename a variable, fix a typo, update an import).
- Established codebase patterns — when the existing project already has a convention for the kind of thing you are adding, follow it. Do not go research a "better" way and propose breaking the convention without asking.
- Problems whose solution is fully constrained by the existing architecture (e.g. "add a new endpoint to this REST API" — the shape is dictated).

**See also:** §Verify external-tool config from source — both rules prefer verified knowledge over recall. Research is for design-shaped problems; config verification is for specific knob existence.

---

### Stay within scope

- A bug fix doesn't need surrounding cleanup. A small task doesn't need a helper class.
- If you spot adjacent issues, mention them at the end ("I noticed X is also broken; want me to look?"). Do not unilaterally expand the work.
- Refactors (renames, file moves, structural changes) require explicit user buy-in BEFORE executing. Present proposal + tradeoffs + ask.
- Match action scope to request scope. If asked for a small change, make a small change. Do not reformat unrelated files or bulk-rename.
- Do not delete or rewrite "legacy"-looking code you happen to be reading. Old does not mean wrong.
- If a task uncovers that the request is mis-scoped (the right fix is two layers up), stop and surface that — do not silently rewrite the request.

---

### Read before writing

- Read a file before editing it. Do not edit from a guess about what is inside.
- Run failing tests and read actual errors before proposing fixes. The error message contains the answer more often than not.
- Check the version in use before recommending an API.
- Verify the surrounding code's style and patterns before adding to it. New code should look like the code next to it, unless the code next to it is what is being changed.
- When the codebase is unfamiliar, explore by reading first; do not propose changes off a partial picture.

---

### Risky actions require confirmation

For destructive or irreversible operations, confirm before executing even if you have technical permission:

- Destructive git: `push --force`, `reset --hard`, `branch -D`, `clean -fd`, `checkout --` on modified files.
- Database: dropping tables, truncating data, running migrations against shared environments.
- Process control: killing processes you did not start, restarting shared services.
- External effects: sending Slack/email, posting to APIs that bill or notify, opening/closing PRs and issues.
- Infrastructure: modifying CI pipelines, deleting cloud resources, changing permissions.

Authorization for one action does not extend to similar actions. "Yes, push this branch" does not authorize "push --force to main." When in doubt, describe what you are about to do and ask.

---

## Quick reference

- **Every type annotation that references a swappable dependency uses a Protocol.** See §Dependency Inversion.
- **The composition root is the only file that imports concrete swappable implementations.** See §Composition Root.
- **Group files by domain, not by technical type.** See §Domain-Driven Module Organization.
- **"Private" markers must match actual reach.** An underscore-prefixed type imported, annotated against, or subclassed across the module boundary isn't private — it's a mislabel. Types are either usable outside their module or they aren't. See §Visibility markers match reach.
- **Validate at the edge, trust internally.** See §Validate at boundaries.
- **Encode invariants in types and constructors, not in comments.** See §Make Illegal States Unrepresentable.
- **One concern per commit. No AI-attribution footers. No PR-number references.** See §Commits.
- **No comment unless the *why* is non-obvious.** No history, no task references, no architecture lore in docstrings. See §Comments and docstrings.
- **Never `assert` for runtime validation.** `python -O` strips it. Raise the specific exception. Also never in production: bare `except:`, hardcoded secrets, blocking I/O in async, retry without jitter+backoff, `float` for money, naïve datetime, string-interpolated SQL/shell, `pickle.loads` on untrusted data, `debug=True`. See §Never in production code.
- **Verify external-tool knobs against the pinned version.** No knobs from memory. See §Verify external-tool config.
- **Don't skip the research-prior-art step for design-shaped problems.** Jumping straight to implementation without surveying existing solutions is a regular failure mode that produces reinvented wheels. See §Research prior art before designing.
- **Stay within scope. Refactors require explicit buy-in.** See §Stay within scope.
