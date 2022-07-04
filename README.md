## Gabor Molnar Engineering - structural-design.eu

The website is composed of a "business card", official "guidance documents" and some sort of forum(?).<br>
Features:<br>
<sub>"Our" here is the "our" of the company Gabor Molnar Engineering Design.</sub>

- Display our work, along with an honest, reflective "about us" that'll woo the millionares
- - All work on one page, seperated by section headers
- - Sections contain text (on guaruntees and values), images and videos.
- - Images contained in carousels
- A rich markdown-flavoured text editor for writing guidance documents
- - Hopefully built in-house (such that it's easily extendable later on)
- - The option is only displayed for admin accounts
- - Protected behind 2Factor Authentication that only official writers can access
- Search engine for guidance documents
- - Also hopefully made in-house, perhaps using TF-IDF on the content of the documents
- - Ability to filter guidance documents based on date created, and tags
- - Ability to sort guidance documents based on relevance, views, activity, and recency
- A "guidance document" is comprised of a title, date created, thumbnail image, content, tags, comments
- A "user" is comprised of a name, email, avatar image (not clickable), status, comments
- A "comment" is comprised of an author (id), parent guidance document (id), date created, content
- - Comments can also be posted anonymously, in which case author is nullable
- - Anonymous comments still however have an id, and anonymous posters can opt-in to have their browser "remember" these comments it posted, such that if the user ever does decide to make an account those comments suddenly have an author.
- - This'll work using browser cookies (that we only ever read after they make an account), meaning we never store any data about anonymous users (defeating the point). Since cookies are browser dependant though, we'd have to wait for the user to use their new account on all platforms they made comments with to successfully assign all their comments to their account (and of course if they clear cookie data then those comments stay anonymous forever).

All text in the website is kept completely non-personal, speaking in the "our"s and "we"s of a professional collective rather than "me"s and "I"s of a single person, which could be seen as fallible and be discriminated against.
