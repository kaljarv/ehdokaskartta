# Kielivaalikone

A simplified versin of Candidate Map for use by Oma Kieli ry in the Finnish Parliamentary Elections 2023.


## To Do

1. CONST: Add contituencies
   1. app module
   2. add database
2. Allow candidate showing on fragment by the list component
   1. Also edit listOnRigth in ngOnInit
3. SWE: Swedish
   1. https://angular.io/guide/i18n-optional-manage-marked-text
   2. app module locale
   3. check all code for strings
   4. incl. index.html
4. CLEANUP: Remove unnecessary stuff
5. Add nice desktop paneling of cand details and list, now broken
6. DATA
   1. Indepedent party
   2. Min vals for mapping and missing values
   3. Filters
   4. Party abbreviations
   5. Candidate details (no TODO)
   6. Party colours
   7. Remove fallback portrait from cand details

## Deploying

`ng deploy` or

first `firebase use --add` then

`ng build -c production; firebase deploy -m "deploy: firebase" --only hosting`

## Author

Ehdokaskartta is designed and implemented by [Kalle Järvenpää](http://kaljarv.com/) or @kaljarv on [Instagram](https://www.instagram.com/kaljarv/) and [Twitter](https://twitter.com/kaljarv). He is a multidisciplinary designer with a background in graphic design, whose current focus is shared between product, interaction and computational design.

## License

MIT