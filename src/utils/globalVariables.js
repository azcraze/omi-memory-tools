// src/utils/globalVariables.js

const logger = require('./logger.js');

/**
 * pluginRenames
 * Array of objects mapping plugin IDs to their display names.
 */
const pluginRenames = [
    { pluginId: "actionable-insights", name: "Actionable Insights" },
    { pluginId: "supermemory-for-omi-01JE0442S4S20TRAHVYAXGQ2RQ", name: "Supermemory" },
    { pluginId: "01JFMFZEPY2YNRK17GDCPPPWBV", name:"Agreements Commitments & Conclusions" },
    { pluginId: "01JFCNTR2P5QV5QJJDAG7BYXRA", name:"_Entity Extraction" },
    { pluginId: "conversation-summarizer", name:"Conversation Summarizer" },
    { pluginId: "qna-coach", name:"QnA Coach" },
    { pluginId: "01JG6WFKEDNW5E47XEAF7BCDC2", name:"_Ontologies" },
    { pluginId: "01JFMBSJPEWVB5BGSZXYFS7H4F", name:"Coherent Transcription" },
    { pluginId: "classroom-01JD1B1FJ5QK9YERCV5FT4DKBG", name:"Classroom V2" },
    { pluginId: "conversation-summariser-v2-01JCYTKYAA9X4NRTVVW8ZDMAXZ", name:"Conversation Summarizer V2" },
    { pluginId: "topic-identifier", name:"Topic Identifier" },
    { pluginId: "01JG96TQH8ZTRV9M1R7B2Q96V9", name:"_Questions" },
    { pluginId: "class-notes", name:"Class Notes" },
    { pluginId: "lie-detector", name:"Lie Detector" },
    { pluginId: "echosense", name:"EchoSense" },
    { pluginId: "nonviolent-communication-coach-01JD1B79T37VF1B4V5HDHZGMQM", name:"Nonviolent Communication Coach" },
    { pluginId: "vocallens-01JDXGE6DC5CCPGS1965NWENJN", name:"VocalLens" },
    { pluginId: "01JG6VNTXDHR4G4M42B4STX5PP", name:"_Connect the Dots" },
    { pluginId: "nvc-communication-analyzer", name:"NVC Communication Analyzer" },
    { pluginId: "lie-detector-pro", name:"Lie Detector Pro" },
    { pluginId: "unspoken-links", name:"Unspoken Links" },
    { pluginId: "dictionary", name:"Automatic Dictionary" },
    { pluginId: "advanced-fact-checker", name:"Advanced Fact Checker" },
    { pluginId: "speaksense-01JDXEEGTNYZFMT2NQH5YZD8XN", name:"SpeakSense" },
    { pluginId: "classroom-insights-01JE12MX2J2MRY9M573AFB56S7", name:"Classroom Insights" },
    { pluginId: "fact-checker-05163", name:"Fact Checker" },
    { pluginId: "kol-01JDVDXX852M5CNCEAC6MNMWP0", name:"KOL" },
    { pluginId: "01JEZC8MYAC69PH7QDC6HSMXN4", name:"Audio Journal" },
    { pluginId: "note-to-self", name:"Note to Self" },
    { pluginId: "grocery-list", name:"Grocery List" },
    { pluginId: "introrevert-01JDQDN0X63T4FEMTH4ESYGMAW", name:"Introvert" },
    
    // Add more plugin mappings as needed
    /**
    { pluginId: "INSERT", name:"INSERT" },
    { pluginId: "INSERT", name:"INSERT" },
    { pluginId: "INSERT", name:"INSERT" },
    { pluginId: "INSERT", name:"INSERT" },
    { pluginId: "INSERT", name:"INSERT" },
    { pluginId: "INSERT", name:"INSERT" },
    { pluginId: "INSERT", name:"INSERT" },
    { pluginId: "INSERT", name:"INSERT" },
    { pluginId: "INSERT", name:"INSERT" },
    { pluginId: "INSERT", name:"INSERT" },
    { pluginId: "INSERT", name:"INSERT" },
    { pluginId: "INSERT", name:"INSERT" },
    { pluginId: "INSERT", name:"INSERT" },
    { pluginId: "INSERT", name:"INSERT" },
    */
];

/**
 * pluginRenamesMap
 * Object mapping plugin IDs to their display names for quick lookup.
 */
const pluginRenamesMap = pluginRenames.reduce((acc, { pluginId, name }) => {
    if (typeof pluginId === 'string' && typeof name === 'string') {
        acc[pluginId] = name;
    } else {
        logger.warn(`globalVariables: Invalid pluginRenames entry - pluginId: ${pluginId}, name: ${name}. Both should be strings.`);
    }
    return acc;
}, {});

/**
 * categoryEmoji
 * Object mapping categories to their associated emojis.
 */
const categoryEmoji = {
    Romance: "🌹",
    Pets: "🐾",
    Star: "⭐",
    // Add more category-emoji mappings as needed
};

/**
 * starredMemories
 * Array of memory IDs that are marked as starred.
 */
const starredMemories = [
    // Example: "be32019e-36c9-4b5f-8043-092cc2aaf5ce"
];

module.exports = {
    pluginRenames,
    pluginRenamesMap,
    categoryEmoji,
    starredMemories,
};
