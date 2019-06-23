### What kind of change does this PR introduce?
- [ ] Bug Fix 
- [ ] Feature 
- [ ] Doc Updates 

---

### What is the current behavior? 
(You can also link to an open issue here)

---

### What is the new behavior (if this is a feature change)? 
(You can also link to an open issue here)

---

### Does this PR introduce a breaking change? 
(What changes might users need to make in their application due to this PR?)
- [ ] Yes 
- [ ] No

---
### Please check if the PR fulfills these requirements
**package.json**
- [ ] Pop the version
- [ ] Add yourself as a contributor using crowdanalyzer email address

**README.md**
- [ ] Add circle ci badge 
- [ ] Make sure circle ci badge works and points to **master** branch

**.env-example**
- [ ] Add sensitive secrets to environment variables and reference their names in .env-example

**lint**
- [ ] Leave empty line after every closing curly brace `}`
- [ ] Equal comparison conditions must follow yoda rule (Value Before Variable) (e.g. `"GET" === req.method`) 
- [ ] Add `use strict` at the beginning of every javascript file
- [ ] Leave empty line before `before`in test cases
- [ ] Use `jsdocs` documentation style 
```
/**
 * 
 * @param {string} param1 
 * @param {number} param2 
 * @returns 
 */
function hola(param1, param2) {

}
```
- [ ] Use snake case (lowercase words separated by underscore) in your json object properties; otherwise use camelCase 
```
const config = {
  url: '',
  router_types: []
}
```

**errors**
- [ ] Create a generic error class to represent all of your class errors
```
class RetryError extends Error {

    constructor(message) {
        super(message);
        this.name = 'RetryError'; 
    }

}
```
- [ ] Make sure all other error classes extend this error class and not the Generic `Error` class 
```
class ConfigurationError extends RetryError {

    constructor(message) {
        super(message);
        this.name = 'ConfigurationError'; 
    }

}
```
- [ ] Use `ConfigurationError` as a class name for illegal argument errors 

**methods**
- [ ] Sort your class methods following the `CRUD` sort; `create` methods then `read` methods then `update` methods then `delete` methods 

**testing**
- [ ] Test happy scenarios first (i.e. success cases first)
- [ ] Assert error classes with `instanceOf` assertions 
```
// good
expect(fn).to.throw(Error).that.is.instanceOf(
    OAuthenticatorsError.OAuthenticatorsIllegalArgumentError
).and.have.property('message').that.equals('missing id');

expect(promise).to.be.eventually.rejectedWith(Error)
    .instanceOf(Errors.InvalidOAuthCredentialsError);
 
// bad
expect(fn).to.throw(
    OAuthenticatorsErrors.OAuthenticatorsIllegalArgumentError
).and.have.property('message').that.equals('missing id');

expect(promise).to.be.eventually.rejectedWith(Errors.InvalidOAuthCredentialsError);
```
