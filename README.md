# Kielivaalikone

A simplified versin of Candidate Map for use by Oma Kieli ry in the Finnish Parliamentary Elections 2023.


## To Do

1. DATA
   1. Indepedent party
   2. Party colours

## Debugging

If localised, run `ng serve` with `-c fi`.

To test on an iPhone, run `ng serve -c fi --host 172.20.10.3` where the IP is the one shown in Network settings.

On the iPhone access, at `http://172.20.10.3:4200`.

Open Safari on the Mac and access console from the Developer menu.

## Localisation

Run: `ng extract-i18n`

See:

* https://angular.io/guide/i18n-optional-manage-marked-text
* https://github.com/daniel-sc/ng-extract-i18n-merge

## Deploying

Does not seem to work: `ng deploy`

First `firebase use --add` then

`ng build -c production; firebase deploy -m "deploy: firebase" --only hosting`

## Author

Ehdokaskartta is designed and implemented by [Kalle Järvenpää](http://kaljarv.com/) or @kaljarv on [Instagram](https://www.instagram.com/kaljarv/) and [Twitter](https://twitter.com/kaljarv). He is a multidisciplinary designer with a background in graphic design, whose current focus is shared between product, interaction and computational design.

## License

MIT