workflow "New workflow" {
  on = "push"
  resolves = ["Run NPM"]
}

action "Run NPM" {
  uses = "actions/npm@e7aaefed7c9f2e83d493ff810f17fa5ccd7ed437"
}
