# NaNoWriMoTools
Tools to help you complete NaNoWriMo: Progress, Characters, Timeline, Word Count.

## Installation

### Setup Firebase

 - Create a firebase database
 - Set the URL in `js/app-config.js`


## Characters

### Details

The characters are added manually as follows:

 - Create a character file for the desired year: `data/characters/characters-YYYY.json`
 - Objects for each characters:

```
    {
        "Settings":
        {
            "Image": true
        },
        "Name": "John Doe",
        "Age": 30,
        "Profession": "Manager of Managing",
        "ShortSummary": "",
        "Region": "",
        "AbstractMotivation":"",
        "ConcreteGoal":"",
        "GoalPreventingConflict":"",
        "Epiphany": "",
        "LongSummary": ""
    }
```

### Avatars

Each character can have an avatar image.  To add an avatar image:

 - In the character details JSON object, set the `Settings.Image` property to `true`.
 - create a folder for the desired year: `data/characters/avatars/YYYY`
 - add images with the character's `Name` (spaces removed) as the file name: `JohnDoe.png`

####Notes

 - Check your JSON: http://jsonlint.com
 - Characters will be displayed in the order of array items
 - Use any keynames and data you wish, but only the provided keys will have a display name
 - Data will be displayed in listed order (but not guaranteed)
 - You may use HTML in your data but escape your quotes.
 - Avatars must be .png
 - Avatars must be 340px x 340px

