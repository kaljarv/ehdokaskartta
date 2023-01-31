# Candidate Map – Towards an Open-Source Platform for Voting Advice Applications

> **Update Jan 2023**: We've started a proper project for the development of an open-source voting advice application platform with gracious funding from Sitra – the Finnish innovation fund. To stay tuned, please visit openvaa.org or follow [@openvaa](https://twitter.com/OpenVaa) on Twitter. The project is, furthermore, accompanied by a research arm conducted by the University of Helsinki and funded, in turn, by the Kone Foundation.

Ehdokaskartta (or Candidate Map) is a prototype Voting Advice Application (VAA) that helps voters find a suitable electoral candidate. It uses open data from Election Compass (‘Vaalikone’) by Yle, the Finnish public broadcasting company, but offers a markedly different user experience. It is built in a modular way that allows for testing of different features and using alternative data sources.

Its ultimate aim is, however, to provide an impetus for testing new ideas in the design of VAAs and—most importantly—open-source development of a plurality of VAAs.

The app (as well as the data it uses) is in Finnish only but the code is (rather sloppily) documented in English. An instance of Ehdokaskartta with the 2021 Finnish municipal election data can be found at https://ehdokaskartta.fi.


## Background

Since Yle’s pioneering 1996 Election Compass, VAAs have come to play an ever more important role in elections, especially in polities with a fragmented party system. According to the follow-up surveys on Finnish parliamentary elections, the amount of respondents relying on VAAs has risen from 8% in 2003 to 35% in 2019 (<a href="http://urn.fi/URN:ISBN:978-952-359-026-7" target="_blank">Borg & Koljonen 2020: Käyttöliittymä vaaleihin [’A user interface into elections’]</a>, p. 48). Moreover, the fraction jumps to 55% for 19-to-29-year-olds.

In line with their increasing importance, a substantial body of research about VAAs has been accumulated internationally. The topics have ranged from methodological questions to effectiveness and the underlying assumptions about the democratic process. [An active research group](http://vaa-research.net/) within the European Consortium for Political Research has even published the so-called [Lausanne Declaration](http://vaa-research.net/?page_id=127) that proposes ‘certain standards and minimal requirements that should be respected by all the makers of VAAs’.


## The Case for Open-Sourcing

Among the general standards listed in the Lausanne declaration are openness, transparency and impartiality. Most makers of VAAs naturally purport to adhere to these values, but the source code and the exact algorithms used in matching are in most cases proprietary. Even disregarding the possibility of intentional bias, this lack of transparency is worrying. Many choices, let alone bugs, made in the design and implementation of VAAs may skew the results one way or another.

Furthermore, in Finland there is a remarkable convergence in the design of VAAs. A plausible explanation for this is that, according to a recent study by researchers from the University of Tampere, out of the 15 VAAs provided by the media in the 2019 parliamentary elections 12 were produced by just two (for-profit) companies, ZEF and Webscale (<a href="http://urn.fi/URN:ISBN:978-952-359-026-7" target="_blank">Borg & Koljonen 2020</a>, p. 60). In addition to these, seven non-governmental organisations published their own VAAs, out of which three were also built by ZEF.

Globally the picture is less clear-cut, but a few products stand out as being used in multiple countries and not just locally: the Dutch Kieskompass, the Canadian Vote Compass and the Greek Preference Matcher. All three are proprietary, although Kieskompass and Vote Compass have published papers outlining the methodologies they employ.

Against this backdrop, it is rather surprising that no serious attempt at an open-source VAA has been made. The largest obstacle in creating one is not, however, the technical implementation but rather collecting data, especially in a pluralistic political landscape such as Finland’s, where the number of candidates in municipal elections is in excess of 35,000. To overcome this, Candidate Map exclusively uses Yle’s open dataset.

(The dataset for the 2021 Finnish municipal elections used in the current prototype contains the following data for roughly half of the 35,627 candidates in all 293 municipalities: Likert scale and ordered preference answers with possible open addenda to ca. 20 policy questions; open answers to topics such as election promises; and background information, such as age, gender, language skills, details on campaign funding and education.)

As even the prototype clearly demonstrates, based on the same dataset a markedly different user experience can be created. Comparing this and [Yle’s own implementation](https://vaalikone.yle.fi/kuntavaalit2021), it becomes eminently clear that many of the design decisions made in VAAs (let alone the underlying methodology in data collection) should be open for discussion and experimentation.

It can thus be argued there be an outstanding need for open-source creation of VAAs and, with the availability of open datasets, a tractable opportunity for that.


## A Two-Part Project

This project comprises two parts, the first of which comprises this implementation and its publication in the 2021 municipal elections (with the election day being June 13, 2021) and studying its usage. The second part will be begun later in 2021 and involves engaging more collaborators (in the domains of social science as well as open data and open source development) and applying for more funding. The goals are gaining momentum for further development of the VAA platform and publishing the results.

If you are interested in contributing to the project, feel free to contact the author.


## Technical specifics

The app uses Google’s [Angular (10) library](https://angular.io/) and [Material Design components](https://material.angular.io/). The data in this implementation is hosted on Firebase but should be easy to alter by editing the DatabaseService.

This is the author’s first take on Angular (and on a web app for that matter). Thus, the code is unfortunately unclean, inelegant and improperly documented. For the second part of the project, the current repository's role is mainly to serve as a user experience test bed. The codebase proper is probably best started from a clean slate.


## Author

Ehdokaskartta is designed and implemented by [Kalle Järvenpää](http://kaljarv.com/) or @kaljarv on [Instagram](https://www.instagram.com/kaljarv/) and [Twitter](https://twitter.com/kaljarv). He is a multidisciplinary designer with a background in graphic design, whose current focus is shared between product, interaction and computational design.


## License

MIT