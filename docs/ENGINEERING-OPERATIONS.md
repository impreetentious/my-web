# Engineering operations

## Performance budgets

The production build has three complementary performance gates:

- `npm run budget:bundle` limits gzip-compressed initial JavaScript to 230 KiB on the home route and 250 KiB on other prerendered routes.
- `npm run budget:performance` limits HTML shell size, script count, preload count, and external stylesheets.
- `npm run budget:lighthouse` runs three desktop Lighthouse samples for the settled home page and blog, then enforces performance and accessibility scores of at least 0.95.

Treat a budget failure as a regression to investigate. Revise a threshold only when the product requirement itself has changed and the new limit is documented with the corresponding code change.
