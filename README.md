# Dice Roller React

This project initially started as a local winforms app that I created in the space of a couple of
weeks for my interview at Bluesmith Information Systems Ltd.

It then went on hold as the group I play TTRPGs with started using https://rolldicewithfriends.com/
to roll dice together as a way of staying honest with online play. More recently however, this dice
roller has been giving us more and more bad rolls so I decided to revive the project in the form of
a web app.

Now I know what you're thinking - "you're probably imagining patterns where there aren't any". Yes,
probably, but TTRPG players live and die by the dice. In physical play if a dice gives you bad
rolls, you throw it away or put it in a dice jail so it can learn that what it did was wrong.
That's the idea behind the project, put the old dice roller in dice jail and use one where I know
what's happening under the hood.

## Common Components

### Header

All pages contain a header, but not all pages contain the elements within. All pages contain a
button in the top-right corner that controls the colour theme (i.e. dark and light mode), all pages
except the login page contain the logout button in the top-left corner, and all of the room pages
contain a button in the center to change the system of dice being used.

### Contexts

There are a couple of contexts used in the web app:

1. `ThemeContext` - manages the theme (mentioned in the [header section](#header)) to ensure it
   remains the same between sessions.
2. `AuthContext` - manages the authentication to ensure that the user remains logged in between
   sessions.

## Login Page

The login page is what everybody sees upon vising the website. The credentials used are email and
password with no method of creating a user (credentials are added by me, the creator). This is to
ensure that the website remains personal and doesn't get used by random people, causing my free
tier Firebase to reach it's limit.

Once logged in, the user will remain logged in and their authentication token is used (along with
the current time) to create the seed used for rolling the dice. This means that each user should
have their own unique seed. Of course, it's entirely possible that two users have the same seed,
but the chances are extremely low.

## Home Page

The home page is where you can connect to a room. What you enter in the box will be cleaned by
replacing any spaces (or `%20`) with dashes, and ensuring the room is in lower case. This is to
ensure that the correct room is used when typnig the url directly, accounting for some mistakes.

## Rooms

The room pages exist beyond the root page, except for `/login`, i.e. `/:room`. Rooms are created
generically based on the `room` value in the url. This is to reduce the amount of reads and writes
made to the database by storing room information there. This way, the only data that's stored are
the dice rolls, with the room name stored along with them to allow for filtering.

In the room, a user can change the dice system by clicking the middle button in the header.
Currently, the following systems are supported:

- `D20 Systems` - nothing special here, just roll a dice and add your value.
- `Cyberpunk RED` - a d10 and d6 based system with the d10 dice exploding once both on success
  and failure (i.e. on success, roll another dice and add it where as on failure, roll another dice
  and subtract it).

The number of dice rolls displayed in the app is 15 per room, showing the rolls for the room in
order of time rolled.

## Future Features

Currently this is the first draft with the most basic features needed to play. In the future I am
looking to implement the following:

- A button to make the login password visible on click.
- Advantage and disadvantage buttons (i.e. roll two dice and take the highest or lowest
  respectively).
- Indication of critical success/failure. This will be more complex depending on the system (e.g.
  Cyberpunk RED has critical injuries when two 6s are rolled in damage calculations).
- The abilitiy to reroll a roll in the history and update the record in the database.
- Any new or old dice systems that my group plays.
