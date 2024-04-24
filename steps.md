## Introduction

Today's topic revolves around leveraging Git Hooks to streamline Git workflows, focusing on code linting before commits and pushes, and standardizing the format of commit messages.

**Git Hooks** are essentially **custom scripts** that trigger during key Git actions.

There are two categories of Git Hooks: **client-side** and **server-side**. Client-side hooks are activated by operations such as committing, merging, and pushing, whereas server-side hooks are triggered by network operations, like receiving pushed commits.

In this post, I will primarily discuss client-side hooks. I'll delve into three specific hooks: **pre-commit**, **commit-msg**, and **pre-push**. The central tool discussed will be [Husky](https://typicode.github.io/husky/), which simplifies the configuration of Git Hooks, making it more straightforward.

Here’s a preview of what I will cover in this post:

```mermaid

flowchart TB

comit_command1[git commit -m 'your message']

push_command1[git push origin branch-name]

lint_staged_c[eslint --fix your-staged-files]
style lint_staged_c fill:#bbf,stroke:#f66

NPM_lint_staged[npm run lint:staged]

NPM_lint_increment[npm run lint:incremental-push]

lint_increment_sh[lint-incremental-push-files.sh]
style lint_increment_sh fill:#bbf,stroke:#f66

NPM_test[npm run test]
style NPM_test fill:#bbf,stroke:#f66

commit_hook[git commit hook: .husky/pre-commit]
style commit_hook fill:#bbf,stroke:#f66

msg_hook[commit message hook: .husky/.commit-msg]
style msg_hook fill:#bbf,stroke:#f66

msg_config[commitlint.config.js]
style msg_config fill:#bbf,stroke:#f66

push_hook[git push hook: .husky/.pre-push]
style push_hook fill:#bbf,stroke:#f66

LintStagedSuccess{no error}
LintIncrementalSuccess{no error}
MsgPass{format is validated}
CommitSuccess(Commit Success)
testPass{test pass}
PushSuccess(Push Success)

comit_command1 --> |trigger| commit_hook --> |run| NPM_lint_staged --> |run| lint_staged --> lint_staged_c --> LintStagedSuccess --> |trigger| msg_hook --> |validate by| msg_config --> MsgPass --> CommitSuccess

push_command1 --> |trigger| push_hook --> |run| NPM_lint_increment --> |run| lint_increment_sh --> LintIncrementalSuccess --> |trigger| NPM_test --> testPass --> PushSuccess

```

### GitHub Repo

If you'd prefer to run the demo I've created instead of following the steps individually, check out this [GitHub repository](https://github.com/graezykev/normalise-your-git-commit-and-push) for a quick overview and hands-on experience.

## Key Takeaways

I would like to outline all the steps I'm gonna elaborate on in this post.

1. [Init your Project](#1-init-your-project-if-you-havent)
2. [Git Pre-Commit Hook](#2-git-pre-commit-hook)
3. [Code Linting](#3-code-linting)
4. [Add Linting to Git Pre-Commit Hook](#4-add-linting-to-git-pre-commit-hook)
5. [lint-staged](#5-lint-staged)
6. [Commit Message Hook](#6-commit-message-hook)
7. [Add commitlint to Commit Message Hook](#7-add-commitlint-to-commit-message-hook)
8. [Tailor your Commit Message Format](#8-tailor-your-commit-message-format)
9. [Git Push Hook](#9-git-push-hook)
10. [Incremental Code Linting](#10-incremental-code-linting)
11. [Force test Before Push](#11-force-test-before-push)

But don't worry, each step is clear and straightforward.

## 1. Init your Project (if you haven't)

### Init NPM

```sh
mkdir normalise-your-git-commit-and-push && \
cd normalise-your-git-commit-and-push && \
npm init -y && \
npm pkg set type="module"
```

### Init Git Repo

```sh
git init && \
echo 'node_modules' >> .gitignore
```

## 2. Git Pre-Commit Hook

The **Git Pre-Commit Hook** is triggered just after you execute the `git commit` command, but before the commit message editor is opened (if you are not using the `-m` option), or before the commit is finalized (if you are using the `-m` option).

What is commit message editor?

The most simple way of specifying our commit message is to execute `git commit -m 'my commit message'`. However, there's a more interactive way to commit using `git commit`.

![alt](images/terminal.gif)

After you run `git commit` without the `-m` option and commit message, Git typically opens an editor for you to enter a commit message (This editor could be Vim, Emacs, Nano, or whatever your default command-line text editor is set to).

Returning to the **Git Pre-Commit Hook**, we can use it to perform checks (such as running the ESLint command), and if these checks fail, the commit action is blocked.

By sharing this **hook script**, you can ensure that every teammate commits only code that has been checked.

Let's explore how we can accomplish this.

### Install Husky

The first important step is to install Husky.

```sh
npm install -D husky@9
```

### Init Husky

```sh
npx husky init
```

What does the command `husky init` primarily do?

- create `hooksPath = .husky/_` in `.git/config`

- create `.husky/_/husky.sh`, `.husky/_/h` etc.

- create a `.husky/pre-commit` wit the script `npm test`

- create a `prepare` script in `package.json` with the command `husky`

> `husky` is in some way included within `husky init`.

- create `.gitignore` in `.husky/_`

### Try A Commit

Since our `pre-commit` hook has been initiated, let's try it.

```sh
git add .
```

```sh
git commit -m 'first commit'
```

Here is what you'll see from the terminal console:

![alt text](images/image.png)

It fails because the pre-commit hook runs the `test` job, which contains only an `exit 1` command in the `test` section of `package.json`.

```json
"scripts": {
  "test": "echo \"Error: no test specified\" && exit 1",
```

Changing it to `exit 0` will make the commit work.

```diff
"scripts": {
-  "test": "echo \"Error: no test specified\" && exit 1",
+  "test": "exit 0",
```

![alt text](images/image-1.png)

> **In a real production project, you should specify your actual `test` command, such as Jest, Playwright, etc.**

## 3. Code Linting

For now, our **pre-commit** hook only includes a `test` command. Next, we'll add a **Linting** command to check the **Code Style** before you commit JavaScript code.

### Install & Configure Linting Tools

Before Linting code in pre-commit hook, let's install and configure ESLint.

```sh
npm install -D eslint@9 @eslint/js@9
```

Create an `eslint.config.js` file with the code below:

```js
import pluginJs from "@eslint/js";

export default [
  pluginJs.configs.recommended
];
```

> Note: I use `export default xxx` here because my `package.json` includes the configuration `"type": "module"`. If you don't have this configuration, use `module.exports = xxx` instead.

### Add Linting Script to `package.json`

```diff
"scripts": {
+  "lint": "eslint .",
```

### Create a Demo `index.js`

```js
export const field = {
    "b": process.evn.bit,
}
```

### Lint the Demo

```sh
npm run lint
```

This will produce some errors because we haven't defined the variable `process` in the demo code, which is not allowed according to the ESLint rule.

![alt text](images/image-3.png)

## 4. Add Linting to Git Pre-Commit Hook

In the last step, we configured a command to lint our code style. Now, we're going to integrate it with the pre-commit hook.

### Put Linting Command to Git Pre-Commit hook

Add `npm run lint` to the first line of `.husky/pre-commit`.

```diff
+ npm run lint
npm test
```

### Try A Commit

Now, all commits will trigger the execution of this linting command.

```sh
git add . & \
git commit -m 'second commit'
```

You'll encounter a failure because you must fix all the linting errors (mentioned above) before committing the code.

![alt text](images/image-2.png)

### Fix the Linting Errors

Fix it by editing `index.js`:

```diff
+const process = {
+    env: {
+        bit: 2
+    }
+}

export const field = {
    "b": process.evn.bit,
}

```

Commit again and it should work.

```sh
git add . & \
git commit -m 'commit after fix index.js'
```

![alt text](images/image-4.png)

### Brief Sum-Up

By now, **both `npm run lint` and `npm test` must pass in the `pre-commit` hook before you can commit**.

### Better Linting

This method of linting may be insufficient for a production project. To integrate a robust linting toolchain, you can check out another post of mine to learn more: [Configure ESLint in a TypeScript Project to Adhere to Standard JS](https://github.com/graezykev/ts-eslint-standard-js).

## 5. lint-staged

Have you noticed the problem with `npm run lint` in the `pre-commit`?

Yes, **all your JavaScript files in the project** are checked in this process. What is the problem, though?

Suppose you're working on a historical project with hundreds of JavaScript files that had never integrated linting tools or Git commit hooks before, meaning there may be numerous code style issues in the existing code.

Today, you integrate these linting tools and Git commit hooks, and tomorrow your teammate edits just one JavaScript file. However, he can't commit it because he faces all the linting issues at once, which are identified by `npm run lint`.

Here’s another example: You've spent a day developing a web page and have written several files like `header.js`, `aside.js`, `main.js`, `footer.js`, etc. But, only `header.js` is complete, the others are still under development.

Now it's 5 o'clock, time to call it a day! You decide to commit `header.js` first, but you encounter similar obstacles as in the previous example.

What we need is a way to commit only the **"code we really want to commit now"**, or more correctly, by Git terminology, the **staged** files.

In simple terms, **staged** files are those files you've added to the **[Git Staging Area](https://git-scm.com/book/en/v2/Getting-Started-What-is-Git%3F#_the_three_states)** by `git add <filename>`.

Only the code in the staging area should be **linted** with each commit.

Now, let's see how to get it done.

### Install lint-staged

[lint-staged](https://github.com/lint-staged/lint-staged) is the second important tools we need here, install it via NPM.

```sh
npm install -D lint-staged
```

### Configure lint-staged

Create a `lint-staged.config.js` file in the project root with the configuration below.

```js
export default {
  // You can lint other types of files with different tools.
  "*.{js,jsx,ts,tsx}": [
    // You can also add other tools to lint your JavaScript here.
    "eslint"
  ]
}

var b // I included this line to intentionally elicit an error output in ESLint latter.
```

> Note: I use `export default xxx` here because my `package.json` includes the configuration `"type": "module"`. If you don't have this configuration, use `module.exports = xxx` instead.

### Add lint-staged Command to NPM Script

```diff
  "lint": "eslint .",
+ "lint:staged": "lint-staged",
```

And of course, modify your hook command accordingly in `.husky/pre-commit`.

```diff
-npm run lint
+npm run lint:staged
```

### Use lint-staged

Remove some code from `index.js`:

```diff
-const process = {
-    env: {
-        bit: 2
-    }
-}

export const field = {
    "b": process.evn.bit,
}

```

To let `lint-staged` identify what you're going to commit, first add the file you want to commit to the Git **Staging Area**.

In this scenario, we have ESLint issues in both `lint-staged.config.js` and `index.js`, but let's say we only want to commit and lint `lint-staged.config.js`.

```sh
git add lint-staged.config.js # don't add index.js
```

Then, commit the file `lint-staged.config.js`.

```sh
git commit -m 'test lint-staged'
```

This time, only the **newly added (staged)** file `lint-staged.config.js` is checked during your commit. You don't need to fix all the JavaScript files in the project, nor even all the JavaScript files you have modified, but just the **staged** file(s) you actually want to commit.

![alt text](images/image-5.png)

Remove the line `var b` in it, and then the commit will succeed.

### lint-staged Other Files

There are more linting tools that I won't go into deeply, but you can integrate them with `lint-staged`. For example, you can lint your **CSS** content with [Stylelint](https://stylelint.io/), or even lint your **README** files with [markdownlint](https://github.com/DavidAnson/markdownlint), etc.

## 6. Commit Message Hook

In the previous steps, we introduced the Git Pre-Commit Hook, which activates immediately after you execute the `git commit` command but before the commit message editor opens or the commit is finalized.

Our next step is to validate the **format of the commit message**.

**Why is format of the commit message so important?**

Well, Git commit message is a **semantic** description of what you are going to do in a specific commit. It's a gateway to **communicate** with your teammates, code reviewers are easier to understand your intention without diving into the code.

Git commit message also **improves traceability**, by linking the commit to external resources like bug and task trackers through identifiers or tags, enhancing the traceability of work and the management of project documentation.

That's the significance of adhering to a standard format for commit messages promotes clarity, coherence, and collaboration within a team.

### Install Commit Message Linting Tools

[commitlint](https://commitlint.js.org/) is the most important tool we need for this step.

```sh
npm install --save-dev @commitlint/{cli,config-conventional}
```

### Configure `commitlint`

Below is a simple (but conventional) configuration, adhering to the [conventional commit format](https://www.conventionalcommits.org/en/v1.0.0/#summary).

```sh
echo "export default { extends: ['@commitlint/config-conventional'] };" > commitlint.config.js
```

> Note: I use `export default xxx` here because my `package.json` includes the configuration `"type": "module"`. If you don't have this configuration, use `module.exports = xxx` instead.

### Test `commitlint`

Run `commitlint` directly to verify the message we used in our last commit, checking if it meet the [conventional commit format](https://www.conventionalcommits.org/en/v1.0.0/#summary).

```sh
npx commitlint --from HEAD~1 --to HEAD --verbose
```

> "from HEAD~1 to HEAD" is your **latest commit**

You will encounter this error:

![alt text](images/image-6.png)

### Why Dose It Fail?

The test case above is mimicking a commit command of `git commit -m 'commit after fix index.js'`.

In this case, your **commit message** is `"commit after fixing index.js"`, but we have a **rule** for the commit message **format** configured in `commitlint.config.js`, which stipulates that the commit message should be structured as [follows](https://www.conventionalcommits.org/en/v1.0.0/#summary):

```txt
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

i.e., your commit message must be at least formatted like `"feat: your commit description ..."`.

However, Your message of `"commit after fixing index.js"` doesn't satisfy the rule, which means your commit will fail.

## 7. Add `commitlint` to Commit Message Hook

Running `commitlint` directly is not appropriate; we should integrate it into an automatic Git Hook (Commit Message Hook).

### Add Linting Script to the Hook

```sh
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg
```

You'll see a newly created file `.husky/commit-msg` with the content below:

```diff
+npx --no -- commitlint --edit \$1
```

### Test the Hook

The Commit Message Hook is ready, now test it.

```sh
git add . & \
git commit -m "this will fail"
```

It fails because neither a `type` nor a `subject` is specified.

![alt text](images/image-7.png)

Make some slightly adjustments:

```sh
git commit -m "foo: this will also fail"
```

As `foo` is not a valid `type`, it fails again.

![alt text](images/image-8.png)

Modify the message once more:

```sh
git commit -m "chore: this is a legal commit message"
```

Hooray!

![alt text](images/image-9.png)

## 8. Tailor your Commit Message Format

In real senarios, the [conventional commit message format](https://www.conventionalcommits.org/en/v1.0.0/#summary) may not meet your team's requirements, sometimes you need to customise your rules.

For instance, your team is using [Jira](https://www.atlassian.com/software/jira) for project and product management, as well as issue tracking, etc. You and your teammates have agreed that every commit should include a Jira ticket ID, allowing you to trace back the real motivation (a product requirement, a technical optimization, a bug, etc.) of every code change.

To do this, edit your `commitlint.config.js` as follows:

```js
export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'subject-prefix-with-jira-ticket-id': parsed => {
          const { subject } = parsed
          const match = subject ? subject.match(/^\[[A-Z]{3,5}-\d+\]\s/) : null
          if (match) return [true, '']
          return [
            false,
            `The commit message's subject must be prefixed with an uppercase JIRA ticket ID.
    A correct commit message should be like: feat: [JIRA-1234] fulfill this feature
    Your subject: ${subject}
    Please revise your commit message.
    `
          ]
        }
      }
    }
  ],
  rules: {
    'subject-prefix-with-jira-ticket-id': [2, 'always']
  }
}
```

> Note: I use `export default xxx` here because my `package.json` includes the configuration `"type": "module"`. If you don't have this configuration, use `module.exports = xxx` instead.

Test it.

```sh
git add . & \
git commit -m 'chore: try to commit'
```

Oops! The commit fails as we just add a new rule to force a **"JIRA ticket ID"** in the commit message's subject.

![alt text](images/image-10.png)

Try another one:

```sh
git commit -m 'chore: [PRJ-1234] a commit with sample id'
```

You've got it!

![alt text](images/image-11.png)

## 9. Git Push Hook

We have taken some steps to ensure our code style and commit message format in the previous steps. One further step is to ensure the code quality before it's pushed to the remote repository.

A **Git Push Hook** is triggered before a push (`git push origin <branch>`) occurs. You can use the Git Push Hook as another **"firewall"** to validate the code before it is pushed to the remote repository.

## 10. Incremental Code Linting

We have run `npm run lint:staged` in `pre-commit`. Does it ensure that there will be no unchecked code contaminating our codebase?

The answer is **No**. You can still commit code that hasn't been fixed by this:

```sh
git add . && \
git commit -m 'whatever I like' --no-verify
```

See the `--no-verify` flag? This allows for a **forced commit**. It's like a hidden time bomb! You're not even able to stop your teammates from doing it sneakily!

So, here we need a second defence line before those **forced committed** codes are pushed to our remote repository and pollute the codebase.

I need to clarify what I mean by **Incremental Code** here.

Say we have the following commits: `commit-a` and `commit-b` have been pushed to the remote repository, and `commit-c` to `commit-N` (not sure how many commits in `...`) have not been pushed yet.

| Commit | Commit time | push status |
| -------- | ------- | ------- |
| commit-N | today | not pushed |
| ... | today | not pushed |
| commit-d | today| not pushed |
| commit-c | today | not pushed |
| commit-b | yesterday | pushed |
| commit-a | the-day-before-yesterday | pushed |

Right now, we're going to push from `commit-c` to `commit-N`, and `commit-c` to `commit-N` represent the **incremental code** in this context.

### Incremental Code Linting Shell Script

Create a **Shell script** file named `scripts/lint-incremental-push-files.sh` with the following code.

In this Shell script, we'll identify those **incremental** JavaScript files we want to **push**, and then run the ESLint command only on them.

```sh
#!/bin/bash

# Ensure you have the latest info from your remote
git fetch

# Automatically identify the current branch and corresponding remote branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
REMOTE_BRANCH="origin/${BRANCH}"

# Find the last commit from the remote branch that has been pushed
LAST_PUSHED_COMMIT=$(git rev-parse ${REMOTE_BRANCH})

# Find the current commit
CURRENT_COMMIT=$(git rev-parse HEAD)

# List changed files since the last pushed commit that match the desired extensions
CHANGED_FILES=$(git diff --name-only $LAST_PUSHED_COMMIT $CURRENT_COMMIT | grep -E '\.(js|jsx|ts|tsx)$')

echo "Files to lint:"
echo $CHANGED_FILES

# Run ESLint on these files if any are found
if [ -z "$CHANGED_FILES" ]
then
    echo "No JavaScript/TypeScript files to lint."
else
    echo "Linting files..."
    ./node_modules/.bin/eslint $CHANGED_FILES
    if [ $? -ne 0 ]; then
        echo "Linting issues found, please fix them."
        exit 1
    fi
fi

```

Make the script executable:

```sh
chmod +x scripts/lint-incremental-push-files.sh
```

Add this script to a NPM script in `package.json`.

```diff
  "scripts": {
    "prepare": "husky",
    "lint": "eslint .",
    "lint:staged": "lint-staged",
+   "lint:incremental-push": "./scripts/lint-incremental-push-files.sh",
    "test": "exit 0"
  },
```

Create the **Git Push Hook** configuration file named `.husky/pre-push`, and add the NPM script to it.

```sh
echo "npm run lint:incremental-push" > .husky/pre-push
```

Now, this Shell script will run every time before your push. Your `git push` command will fail if the incremental code doesn't pass the ESLint check, meaning no **force-committed** code can pass through!

### Test Incremental Code Linting

Before making any changes and testing the incremental changes since the last push, **we need to push the code first**.

```sh
git push origin main
```

Now, let's make some changes.

Open `index.js` to add a simple line.

```diff
+var a
```

You can not commit it because we have a `pre-commit` hook to lint the file.

```sh
git add . & \
git commit -am 'bypass eslint to commit'
```

![alt text](images/image-12.png)

But you can bypass the check with `--no-verify`.

```sh
git commit -am 'bypass eslint to commit' --no-verify
```

![alt text](images/image-13.png)

Do a similar thing to `eslint.config.js` with a new line:

```diff
+var b;
```

Bypass the check process again.

```sh
git add . & \
git commit -am 'bypass eslint again to commit' --no-verify
```

Just now, we have two commits including `index.js` and `eslint.config.js`, in which there are actually ESLint issues, but they were committed using tricks (`--no-verify`).

The commits in the yellow rectangle are the so-called **incremental changes** to be pushed, but they should not be pushed since they have ESLint issues!

![alt text](images/image-14.png)

But don't panic, we've got your back! They won't be able to be pushed because they will face the punishment of the **Git Push Hook** we made above!

If you try to push the code:

```sh
git push origin main
```

All **Incremental Errors** will be caught!

![alt text](images/image-15.png)

## 11. Force `test` Before Push

Let's modify our team's workflows.

Now I have decided to allow **linted** code **commits**, without the `test` verification.

However, we will permit code **pushes** only if they have already passed the **test** verification.

Therefore, we will move the `npm test` command from the **Git Commit Hook** hook to the **Git Push Hook** named `pre-push`.

To do that, edit `./husky/pre-commit`:

```diff
npm run lint:staged
- npm test
```

And move the `test` command to the **Git Push Hook**.

```sh
echo "npm test" >> .husky/pre-push
```

Let's edit the `package.json`'s `test` command to intentionally make the test fail:

```diff
"scripts": {
-  "test": "exit 0",
+  "test": "exit 1",
```

Now, if you try to push any code, you'll fail because we have an `exit 1` in the command. This means the `test` process is not passed, preventing you from pushing the **"un-tested"** code to the remote repository.

```sh
git commit -am 'chore: [TEST-1234] test commit'& \
git push origin main
```

![alt text](images/image-16.png)

Revert `exit 1` to `exit 0`, or use your **actual test scripts** that can pass, your code push to the remote repository will succeed!

### Force Push

Unfortunately, you can still bypass the `pre-push` check and force push the code by using the `--no-verify` flag, just as you can force a commit.

```sh
git push origin main --no-verify
```

To address this, we need **server-side** Git hooks or `CI` systems. However, these are more complex topics, and I won't delve deeply into them now. Perhaps I'll write another post to introduce them in the future.

## Conclusion: DIY your Workflows

In this post, I've delved into detailed steps to normalize our teams' Git workflow. My approach is just a basic framework; there are many Git hooks I haven't mentioned here. You should customize your Git hooks to tailor them to your team's workflow.

Here are some additional steps you might consider:

- Implement specific rules for commit message formatting after discussing with your teammates.
- Perform both linting and testing in commits and pushes.
- Add other commands or scripts to your Git commit/push hooks, such as sending an IM message or an email to notify your teammates of your changes.
- Use your imagination to customize the workflow as you see fit.
