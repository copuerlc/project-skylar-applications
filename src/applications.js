/**
 * ============================================================
 * PROJECT SKYLAR APPLICATION CONFIGURATION
 * ============================================================
 *
 * THIS IS THE MAIN FILE YOU EDIT TO CUSTOMIZE APPLICATIONS.
 *
 * Supported question types:
 *
 *   text
 *   number
 *   yesno
 *   multiple
 *
 * ------------------------------------------------------------
 * HOW TO ADD / EDIT QUESTIONS
 * ------------------------------------------------------------
 *
 * Text:
 * {
 *   id: "timezone",
 *   question: "What timezone are you in?",
 *   type: "text"
 * }
 *
 * Number:
 * {
 *   id: "age",
 *   question: "What is your age?",
 *   type: "number"
 * }
 *
 * Yes / No:
 * {
 *   id: "experience",
 *   question: "Have you had staff experience before?",
 *   type: "yesno"
 * }
 *
 * Multiple Choice:
 * {
 *   id: "position",
 *   question: "What position are you applying for?",
 *   type: "multiple",
 *   choices: [
 *     "Helper",
 *     "Moderator",
 *     "Administrator"
 *   ]
 * }
 *
 * ------------------------------------------------------------
 * TO ADD ANOTHER APPLICATION
 * ------------------------------------------------------------
 *
 * Copy one of the application sections below and give it
 * a unique name, for example:
 *
 * developer: {
 *   name: "Developer",
 *   buttonLabel: "Apply For Developer",
 *   emoji: "💻",
 *   description: "Apply to become a Project Skylar Developer.",
 *   questions: [...]
 * }
 *
 * ============================================================
 */

const APPLICATIONS = {

  // ==========================================================
  // HELPER APPLICATION
  // ==========================================================

  helper: {
    name: "Helper",

    buttonLabel: "Apply For Helper",

    emoji: "🛡️",

    description:
      "Apply to join the Project Skylar Helper team.",

    questions: [

      {
        id: "age",
        question: "What is your age?",
        type: "number"
      },

      {
        id: "timezone",
        question: "What timezone are you in?",
        type: "text"
      },

      {
        id: "activity",
        question: "How active are you?",
        type: "text"
      },

      {
        id: "experience",
        question: "Have you had staff experience before?",
        type: "yesno"
      },

      {
        id: "motivation",
        question: "Why do you want to become a Helper?",
        type: "text"
      },

      {
        id: "loginscreen",
        question: "What do you do when you get the Login Screen?",
        type: "text"
      },

      {
        id: "hours",
        question: "How many hours per week can you be active?",
        type: "number"
      }

    ]
  },


  // ==========================================================
  // CONTENT CREATOR APPLICATION
  // ==========================================================

  content_creator: {
    name: "Content Creator",

    buttonLabel: "Apply For Content Creator",

    emoji: "🎥",

    description:
      "Apply to become an official Project Skylar Content Creator.",

    questions: [

      {
        id: "age",
        question: "What is your age?",
        type: "number"
      },

      {
        id: "platforms",
        question: "What platforms do you create content on?",
        type: "text"
      },

      {
        id: "username",
        question: "What is your username/channel name?",
        type: "text"
      },

      {
        id: "followers",
        question: "How many followers/subscribers do you have?",
        type: "number"
      },

      {
        id: "content_type",
        question: "What type of content do you create?",
        type: "text"
      },

      {
        id: "links",
        question: "Send links to your content.",
        type: "text"
      },

      {
        id: "motivation",
        question:
          "Why do you want to become a Project Skylar Content Creator?",
        type: "text"
      },

      {
        id: "activity",
        question: "How active are you?",
        type: "text"
      }

    ]
  },


  // ==========================================================
  // STAFF APPLICATION
  // ==========================================================

  staff: {
    name: "Staff",

    buttonLabel: "Apply For Staff",

    emoji: "🔨",

    description:
      "Apply to join the official Project Skylar staff team.",

    questions: [

      {
        id: "age",
        question: "What is your age?",
        type: "number"
      },

      {
        id: "timezone",
        question: "What timezone are you in?",
        type: "text"
      },

      {
        id: "activity",
        question: "How active can you be?",
        type: "text"
      },

      {
        id: "experience",
        question:
          "Do you have previous staff experience?",
        type: "yesno"
      },

      {
        id: "position",
        question:
          "What staff position are you applying for?",
        type: "multiple",
        choices: [
          "Helper",
          "Moderator",
          "Administrator"
        ]
      },

      {
        id: "experience_details",
        question:
          "If you have previous staff experience, tell us about it.",
        type: "text"
      },

      {
        id: "motivation",
        question:
          "Why do you want to join the Project Skylar staff team?",
        type: "text"
      },

      {
        id: "argument",
        question:
          "What would you do if two members started arguing?",
        type: "text"
      },

      {
        id: "rule_breaking",
        question:
          "What would you do if you saw a member breaking a server rule?",
        type: "text"
      },

      {
        id: "teamwork",
        question:
          "How would you handle a disagreement with another staff member?",
        type: "text"
      },

      {
        id: "hours",
        question:
          "How many hours per week can you be active?",
        type: "number"
      }

    ]
  }

};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
  APPLICATIONS
};