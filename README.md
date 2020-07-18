# Ehdokaskartta

Ehdokaskartta (or Candidate Map) is a prototype web app that helps voters find a suitable electoral candidate. It uses open data from Election Compass (‘Vaalikone’) by Yle, the Finnish public broadcasting company, but offers a markedly different user experience.

The service (as well as the data it uses) are in Finnish only but the code is (rather sloppily) documented in English. An instance of Ehdokaskartta with the 2018 Finnish parliamentary election data can be found at http://kaljarv.com/ehdokaskartta.


## Motivation

Since Yle’s pioneering 1996 Election Compass, VAAs or Voting Advice Applications (as these are formally known) have come to play an important role in elections, especially in polities with a fragmented party system. Their main purpose is most often to try and match the voter with suitable candidates (or parties) based on an opinion questionnaire, which both the candidates and the voter fill.

Ehdokaskartta prototypes novel solutions to a number of issues with VAA’s, especially:

* Presentation of candidates on a 2-dimensional map instead of a list based on matching scores
* Less rigid and tedious inputting of the voter’s answers
* Further filtering of candidates
* Incorporation of party averages into the results
* Assuming a mobile-first approach
* Facilitating studying the political landscape in general

Any feedback or questions are more than welcome.

The project is part of the democracy theme for Aalto University’s Visual Communications programme’s spring 2020 semester.


## Technical specifics

The app uses Google’s [Angular (9) library](https://angular.io/) and [Material Design components](https://material.angular.io/). The data in this implementation is hosted on Firebase but should be easy to alter by editing the DatabaseService. The app also employs [Andrej Karpathy’s](https://github.com/karpathy) Javascript implementation of the t-SNE algorithm.

This is the author’s first take on Angular (and on a web app for that matter). Thus, the code is unfortunately not clean, elegant nor properly documented. Sorry!


## Author

Ehdokaskartta is designed and implemented by [Kalle Järvenpää](http://kaljarv.com/) or @kaljarv on [Instagram](https://www.instagram.com/kaljarv/) and [Twitter](https://twitter.com/kaljarv). I’m a multidisciplinary designer with a background in graphic design. My current focus is shared between product, interaction and computational design.


## License

MIT