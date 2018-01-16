const express = require("express");
const bodyParser = require("body-parser");
const nodeAdmin = require("nodeadmin");
const mySql = require("mysql");
const moment = require("moment");
const cors = require("cors");

// Getting connection to MySQL database
const mySqlConnectionPool = {
    connectionPool: mySql.createPool({
                        connectionLimit: 5,
                        host: "localhost",
                        user: "root",
                        database: "ClassicalMusicWebsiteDatabase"
    }),
    initialized: false
};

// Initialize Express Framework and other components used
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended:true
}));
app.use(nodeAdmin(app));

// Serving data for frontend
app.use(express.static("assets"));

// RESTful API for classical music website

// Check if an object is undefined
function isUndefined(object) {
    return typeof(object) === "undefined";
}

// Delete null values from an array
function removeNulls(array) {
    let currentNullIndex = array.indexOf(null);
    while(currentNullIndex > -1) {
        array.splice(currentNullIndex, 1);
        currentNullIndex = array.indexOf(null);
    }
    return array;
}

// Replace null values (with NULL string for INSERT)
function replaceNulls(array, replaceValue) {
    let currentNullIndex = array.indexOf(null);
    while(currentNullIndex > -1) {
        array.splice(currentNullIndex, 1, replaceValue);
        currentNullIndex = array.indexOf(null);
    }
    return array;
}

// Database hardcoded table names:
const tableNames = {
    composer: "Composer",
    piece: "Piece",
    composerSearchHistory: "ComposerVisitHistory",
    pieceSearchHistory: "PieceVisitHistory"
};

const tableColumns = {
    composer: ["Name", "LifeDescription", "BirthDate", "Popularity", "Period", "WikipediaLink", "CatalogName"],
    piece: ["ComposerId", "CreationYear", "Description", "WikipediaLink", "Name", "Favorite", "FirstYoutubeLink", "CatalogNumber"]
};

// Error messages for requests:
const errorMessages = {
    restRequests: {
        getDatabaseQueryFailed: function(tableName) {
            return "Unable to fetch rows from " + tableName + " table";
        }
    },
    log: {
        getDatabaseQueryFailed: function(endpoint, error) {
            return "Error on" + endpoint + " when retrieving rows: " + error;
        }
    },
    logAndRestRequest: {
        searchHistoryInsertFailed: function(tableName) {
            return "Error when inserting into history of table: " + tableName;
        },
         connectionFailed: function(endpoint, error) {
            return "Error on " + endpoint + " when connecting to database: " + error;
        }
    }
};

// Hardcodig SQL queries to reduce error likelihood
const sqlQueries = {
  allEntries: function(tableName) {
      return "SELECT * FROM " + tableName;
  },
  entryById: function(tableName, id) {
      return "SELECT * FROM " + tableName + " WHERE Id = " + id;
  },
  entriesByAttribute: function(tableName, attribute, attributeValue) {
      return "SELECT * FROM " + tableName + " WHERE LOWER(" + attribute + ")  LIKE '" + attributeValue +"%'";
  },
  composers: "SELECT Id, Name, DATE_FORMAT(BirthDate, '%d/%m/%Y') AS BirthDate, Popularity, Period FROM Composer",
  composersNames: "SELECT Id, Name FROM Composer",
  pieces: "SELECT p.Id AS Id, p.ComposerId AS ComposerId, c.Name AS ComposerName, p.Name AS Name, p.CreationYear AS CreationYear, p.Favorite AS Favorite " +
          "FROM Piece AS p JOIN Composer AS c ON (p.ComposerId = c.Id)",
  alterForeignKeyCheck: function(enable) {
      return "SET FOREIGN_KEY_CHECKS = " + (enable ? 1 : 0);
  }    
};

const sqlDDM = {
    insert: function(tableName, values, columns = null) {
        if(columns === null) {
            return "INSERT INTO " + tableName + " VALUES (" + values + ")";
        }
        else {
            return "INSERT INTO " + tableName + " (" + columns + ") VALUES (" + values + ")";
        }
    },
    update: function(tableName, columns, values, id = null) {
        let result = "UPDATE " + tableName;
        let setGenerated = false;
        let columnCount = Math.min(columns.length, values.length);
        for(let i=0; i<columnCount; i++) {
            if(values[i] !== null && !setGenerated) {
                result += "\nSET " + columns[i] + " = " + values[i] + (i < columnCount - 1 ? "," : "");
                setGenerated = true;
            }
            else if(values[i] !== null && setGenerated) {
                result += "\n" + columns[i] + " = " + values[i] + (i < columnCount - 1 ? "," : "");
            }
        }
        if(id !== null) {
            result += "\nWHERE Id = " + id;
        }
        return result;
    },
    delete: function(tableName, id) {
        return "DELETE FROM " + tableName + " WHERE Id = " + id;
    }
};

// Obtaining a connection from the pool
function getConnection(response, endpoint, callback) {
    console.log("Available connections: " + mySqlConnectionPool.connectionPool._freeConnections.length);
    if (!mySqlConnectionPool.initialized || mySqlConnectionPool.connectionPool._freeConnections.length > 0) {
        mySqlConnectionPool.connectionPool.getConnection(function(error, connection) {
                if (error) {
                    console.log(errorMessages.logAndRestRequest.connectionFailed(endpoint, error));
                    response.status(401).send(errorMessages.logAndRestRequest.connectionFailed(endpoint, error));
                    callback(null);
                }
                else {
                    mySqlConnectionPool.initialized = true;
                    callback(connection);
                }
        });
    }
    else {
        callback(null);
    }
}

// Get a list of Ids from the result set of a query
// function getIdObject(queryResult) {
//     let resultCount = queryResult.length;
//     var result = {};
//     for(let i=0; i<resultCount; i++) {
//         result["Row " + (i+1).toString()] = queryResult[i]["Id"];
//     }
//     return result;
// }

// Add history search to specialized tables
// function addSearchHistory(mySqlInstance, endpoint, id) {
//     // See whether we need to insert to piece or composer search history
//     var object = {Timestamp: moment(Date.now()).format("YYYY-MM-DD hh:mm:ss"),
//                   Id: id};
//     var error;
//     mySqlInstance.query(sqlDDM.insert((endpoint.indexOf("/composers/") > -1) ? tableNames.composerSearchHistory : tableNames.pieceSearchHistory), object, function(insertError, result) {
//         error = insertError;
//     });
//     return error;
// }

// Unite words separated by _ in a single word
function separatorToSpaceWords(string, separator, wrap = false) {
    if (!isUndefined(string)) {
        let wordArray = string.split(separator);
        var result = wrap ? "'" : "";
        for (let i = 0; i < wordArray.length; i++) {
            result += wordArray[i] + ((i < wordArray.length - 1) ? " " : "");
        }
        return wrap ? result + "'" : result;
    }
    else {
        return null;
    }
}

// Add to search history table everytime a user search is executed
function addSearchHistory(connection, endpoint, queryResult) {
    var columnValues;
    var error = null;
    let finish = false;
    for (let i = 0; i < queryResult.length && !finish; i++) {
        columnValues = "";
        columnValues += "'" + moment.utc().local().format("YYYY-MM-DD HH:mm:ss").toString() + "', ";
        columnValues += queryResult[i]["Id"].toString();
        connection.query(sqlDDM.insert((endpoint.indexOf("/composers/") > -1 ? tableNames.composerSearchHistory : tableNames.pieceSearchHistory), columnValues), function(insertError, result) {
            error = insertError;
            finish = true;
        });
    }
    return error;
}

// GET requests 
app.get("/composers", function(request, response) {
    getConnection(response, "/composers", function(connection) {
        if (connection !== null) {
            connection.query(sqlQueries.allEntries(tableNames.composer), function(error, result, fields) {
                connection.release();
                if (error) {
                    console.log(errorMessages.log.getDatabaseQueryFailed("/composers", error));
                    response.status(403).send(errorMessages.restRequests.getDatabaseQueryFailed(tableNames.composer));
                }
                else {
                    response.status(200).send(result);
                }
            });
        }
    });
});

app.get("/composers-table", function(request, response) {
    getConnection(response, "/composers-table", function(connection) {
        if (connection !== null) {
            connection.query(sqlQueries.composers, function(error, result, fields) {
                connection.release();
                if (error) {
                    console.log(errorMessages.log.getDatabaseQueryFailed("/composers", error));
                    response.status(403).send(errorMessages.restRequests.getDatabaseQueryFailed(tableNames.composer));
                }
                else {
                    response.status(200).send(result.map(function(composer) {
                        return ({
                          Id: composer.Id,
                          Name: composer.Name,
                          BirthDate: composer.BirthDate,
                          Popularity: composer.Popularity,
                          Period: composer.Period
                        });
                    }));
                }
            });
        }
    });
});

app.get("/composer-names", function(request, response) {
    getConnection(response, "/composers-table", function(connection) {
        if (connection !== null) {
            connection.query(sqlQueries.composersNames, function(error, result, fields) {
                connection.release();
                if (error) {
                    console.log(errorMessages.log.getDatabaseQueryFailed("/composers", error));
                    response.status(403).send(errorMessages.restRequests.getDatabaseQueryFailed(tableNames.composer));
                }
                else {
                    response.status(200).send(result);
                }
            });
        }
    });
});

app.get("/composers/:id", function(request, response) {
    getConnection(response, "/composers/:id", function(connection) {
        if (connection !== null) {
            let composerId = request.params.id;
            connection.query(sqlQueries.entryById(tableNames.composer, composerId), function(error, result, fields) {
                connection.release();
                if (error) {
                    console.log(errorMessages.log.getDatabaseQueryFailed("/composers/:id", error));
                    response.status(403).send(errorMessages.restRequests.getDatabaseQueryFailed(tableNames.composer));
                }
                else {
                    response.status(200).send(result);
                }
            });
        }
    });
});

app.get("/search/composers/:name", function(request, response) {
    getConnection(response, "/search/composers/:id", function(connection) {
        if (connection !== null) {
            let composerName = separatorToSpaceWords(request.params.name, "_");
            console.log(sqlQueries.entriesByAttribute(tableNames.composer, "Name", composerName));
            connection.query(sqlQueries.entriesByAttribute(tableNames.composer, "Name", composerName), function(error, result, fields) {
                if (error) {
                    connection.release();
                    console.log(errorMessages.log.getDatabaseQueryFailed("/search/composers/:id", error));
                    response.status(403).send(errorMessages.restRequests.getDatabaseQueryFailed(tableNames.composer));
                }
                else {
                    // Registering query search into history and then sending response
                    let historyError = addSearchHistory(connection, "/search/composers/:name", result);
                    connection.release();
                    if (historyError !== null) {
                        console.log(errorMessages.restRequests.searchHistoryInsertFailed(tableNames.composer));
                        response.status(403).send(errorMessages.restRequests.searchHistoryInsertFailed(tableNames.composer));
                    }
                    else {
                        response.status(200).send(result);
                    }
                }
            });
        }
    });
});

app.get("/pieces-table", function(request, response) {
    getConnection(response, "/pieces", function(connection) {
       if (connection !== null) {
           connection.query(sqlQueries.pieces, function(error, result, fields) {
               connection.release();
               if (error) {
                   console.log(errorMessages.log.getDatabaseQueryFailed("/pieces", error));
                   response.status(403).send(errorMessages.restRequests.getDatabaseQueryFailed(tableNames.piece));
               }
               else {
                   response.status(200).send(result);
               }
           });
       }
   });
});

app.get("/pieces", function(request, response) {
    getConnection(response, "/pieces", function(connection) {
       if (connection !== null) {
           connection.query(sqlQueries.allEntries(tableNames.piece), function(error, result, fields) {
               connection.release();
               if (error) {
                   console.log(errorMessages.log.getDatabaseQueryFailed("/pieces", error));
                   response.status(403).send(errorMessages.restRequests.getDatabaseQueryFailed(tableNames.piece));
               }
               else {
                   response.status(200).send(result);
               }
           });
       }
   });
});

app.get("/pieces/:id", function(request, response) {
    getConnection(response, "/pieces/:id", function(connection) {
        if (connection !== null) {
            connection.release();
            let pieceId = request.params.id;
            connection.query(sqlQueries.entryById(tableNames.piece, pieceId), function(error, result, fields) {
                if (error) {
                    console.log(errorMessages.log.getDatabaseQueryFailed("/pieces/:id", error));
                    response.status(403).send(errorMessages.restRequests.getDatabaseQueryFailed(tableNames.piece));
                }
                else {
                    response.status(200).send(result);
                }
            });
        }
    });
});

app.get("/search/pieces/:name", function(request, response) {
    getConnection(response, "/search/pieces/:name", function(connection) {
        if (connection !== null) {
            let pieceName = separatorToSpaceWords(request.params.name, "_");
            connection.query(sqlQueries.entriesByAttribute(tableNames.piece, "Name", pieceName), function(error, result, fields) {
                if (error) {
                    connection.release();
                    console.log(errorMessages.log.getDatabaseQueryFailed("/search/pieces/:name", error));
                    response.status(403).send(errorMessages.restRequests.getDatabaseQueryFailed(tableNames.piece));
                }
                else {
                    let historyError = addSearchHistory(connection, "/search/pieces/:name", result);
                    connection.release();
                    if (historyError !== null) {
                        console.log(errorMessages.restRequests.searchHistoryInsertFailed(tableNames.piece));
                        response.status(403).send(errorMessages.restRequests.searchHistoryInsertFailed(tableNames.piece));
                    }
                    else {
                        response.status(200).send(result);
                    }
                }
            });
        }
    });
});

// POST requests:
app.post("/composer", function(request, response) {
   getConnection(response, "/composer", function(connection) {
       if (connection !== null) {
           // Obtaining data for the new object
           let composerName = separatorToSpaceWords(request.query.Name, "_", true);
           let composerLifeDescription = separatorToSpaceWords(request.query.LifeDescription, "_", true);
           let composerBirthDate = !isUndefined(request.query.BirthDate) ? "'" + moment(request.query.BirthDate, "DD-MM-YYYY").format("YYYY-MM-DD") + "'" : null;
           let composerPeriod = separatorToSpaceWords(request.query.Period, "_", true);
           let composerWikipediaLink = !isUndefined(request.query.WikipediaLink) ? "'" + request.query.WikipediaLink + "'" : null;
           let composerPopularity =!isUndefined(request.query.Popularity) ? request.query.Popularity : null;
           let composerCatalogName = separatorToSpaceWords(request.query.CatalogName, "_", true);
           var composerData = replaceNulls([composerName, composerLifeDescription, composerBirthDate, composerPopularity, composerPeriod, composerWikipediaLink, composerCatalogName], "NULL");
           let columns = tableColumns.composer;
           console.log("Statement: " + sqlDDM.insert(tableNames.composer, composerData.join(","), columns.join(",")));
           connection.query(sqlDDM.insert(tableNames.composer, composerData.join(","), columns.join(",")), function(error, result) {
                connection.release();
                if (error) {
                    console.log(errorMessages.log.getDatabaseQueryFailed("/composer"));
                    response.status(403).send(errorMessages.restRequests.getDatabaseQueryFailed(tableNames.composer));
                }
                else {
                    response.status(200).send(composerData);
                }
            });
        }
        else {
            console.log(errorMessages.log.getDatabaseQueryFailed("/composer"));
                    response.status(403).send(errorMessages.restRequests.getDatabaseQueryFailed(tableNames.composer));
        }
   });
});

app.post("/piece", function(request, response) {
   getConnection(response, "/piece", function(connection) {
       // Data for INSERT 
       if (connection !== null) {
           let composerId = request.query.ComposerId;
           let creationYear = !isUndefined(request.query.CreationYear) ? request.query.CreationYear : null;
           let description = separatorToSpaceWords(request.query.LifeDescription, "_", true);
           let wikipediaLink = !isUndefined(request.query.WikipediaLink) ? "'" + request.query.WikipediaLink + "'" : null;
           let name = separatorToSpaceWords(request.query.Name, "_", true);
           let youtubeLink = separatorToSpaceWords(request.query.YoutubeLink, true);
           let catalogNumber = !isUndefined(request.query.CatalogNumber) ? request.query.CatalogNumber : null;
           let pieceData = replaceNulls([composerId, creationYear, description, wikipediaLink, name, youtubeLink, catalogNumber], "NULL");
           let columns = tableColumns.piece.filter(column => column !== "Favorite");
           connection.query(sqlDDM.insert(tableNames.piece, pieceData.join(","), columns.join(",")), function(error, result) {
               connection.release();
               if (error) {
                   console.log(errorMessages.log.getDatabaseQueryFailed("/piece"));
                   response.status(403).send(errorMessages.restRequests.getDatabaseQueryFailed(tableNames.piece));
               }
               else {
                   response.status(200).send(pieceData);
               }
           });
       }
       else {
           console.log(errorMessages.log.getDatabaseQueryFailed("/piece"));
           response.status(403).send(errorMessages.restRequests.getDatabaseQueryFailed(tableNames.piece));
       }
   });
});

// PUT requests
app.put("/composer", function(request, response) {
    getConnection(response, "/composer", function(connection) {
        if (connection !== null) {
            // Obtaining data for update
            let composerId = request.query.Id;
            let composerName = separatorToSpaceWords(request.query.Name, "_", true);
            let composerLifeDescription = separatorToSpaceWords(request.query.LifeDescription, "_", true);
            let composerBirthDate = !isUndefined(request.query.BirthDate) ? "'" + moment(request.query.BirthDate, "DD-MM-YYYY").format("YYYY-MM-DD") + "'" : null;
            let composerPeriod = separatorToSpaceWords(request.query.Period, "_", true);
            let composerWikipediaLink = !isUndefined(request.query.WikipediaLink) ? "'" + request.query.WikipediaLink + "'" : null;
            let composerCatalogName = separatorToSpaceWords(request.query.CatalogName, "_", true);
            let composerPopularity = !isUndefined(request.query.Popularity) ? request.query.Popularity : null;
            var composerData = replaceNulls([composerName, composerLifeDescription, composerBirthDate, composerPopularity, composerPeriod, composerWikipediaLink, composerCatalogName], "NULL");
            console.log("Got update: " + sqlDDM.update(tableNames.composer, tableColumns.composer, composerData, composerId));
            connection.query(sqlDDM.update(tableNames.composer, tableColumns.composer, composerData, composerId), function(error, result) {
                connection.release();
                if (error) {
                    console.log(errorMessages.log.getDatabaseQueryFailed("/composer"));
                    response.status(403).send(errorMessages.restRequests.getDatabaseQueryFailed(tableNames.composer));
                }
                else {
                    response.status(200).send(composerData);
                }
            });
        }
        else {
            console.log(errorMessages.log.getDatabaseQueryFailed("/composer"));
            response.status(403).send(errorMessages.restRequests.getDatabaseQueryFailed(tableNames.composer));
        }
    });
});

app.put("/piece", function(request, response) {
    getConnection(response, "/composer", function(connection) {
       if(connection !== null) {
           // Getting data for update
           let pieceId = request.query.pieceId;
           let composerId = request.query.composerId;
           let creationYear = !isUndefined(request.query.creationYear) ? request.query.creationYear : null;
           let description = separatorToSpaceWords(request.query.description, "_", true);
           let wikipediaLink = !isUndefined(request.query.wikipediaLink) ? "'" + request.query.wikipediaLink + "'" : null;
           let name = separatorToSpaceWords(request.query.name, "_", true);
           let youtubeLink = separatorToSpaceWords(request.query.youtubeLink, true);
           let catalogNumber = !isUndefined(request.query.catalogNumber) ? request.query.catalogNumber : null;
           let favorite = !isUndefined(request.query.favorite) ?  request.query.favorite : false;
           let pieceData = replaceNulls([composerId, creationYear, description, wikipediaLink, name, favorite, youtubeLink, catalogNumber], "NULL");
           // console.log("Got update: " + sqlDDM.update(tableNames.piece, tableColumns.piece, pieceData, pieceId));
           connection.query(sqlDDM.update(tableNames.piece, tableColumns.piece, pieceData, pieceId), function(error, result) {
               connection.release();
              if(error) {
                  console.log(errorMessages.log.getDatabaseQueryFailed("/piece"));
                  response.status(403).send(errorMessages.restRequests.getDatabaseQueryFailed(tableNames.piece));
              } 
              else {
                  response.status(200).send(pieceData);
              }
           });
       } 
       else {
           console.log(errorMessages.log.getDatabaseQueryFailed("/piece"));
           response.status(403).send(errorMessages.restRequests.getDatabaseQueryFailed(tableNames.piece));
       }
    });
});

// DELETE requests
app.delete("/composers/:id", function(request, response) {
    getConnection(response, "/composers/:id", function(connection) {
       if(connection !== null) {
           // Get deleted ID
           let composerId = request.params.id;
           connection.query(sqlDDM.delete(tableNames.composer, composerId), function(error, result) {
               connection.release();
               if(error) {
                    console.log(errorMessages.log.getDatabaseQueryFailed("/composer/:id"));
                    response.status(403).send(errorMessages.restRequests.getDatabaseQueryFailed(tableNames.composer));
               }
               else {
                   response.status(200).send(result);
               }
           });
       }
       else {
           console.log(errorMessages.log.getDatabaseQueryFailed("/composers/:id"));
           response.status(403).send(errorMessages.restRequests.getDatabaseQueryFailed(tableNames.composer));
       }
    });
});

app.delete("/pieces/:id", function(request, response) {
    getConnection(response, "/pieces/:id", function(connection) {
       if(connection !== null) {
           // Get deleted ID
           let pieceId = request.params.id;
           connection.query(sqlQueries.alterForeignKeyCheck(false), function(error, result) {
                   connection.query(sqlDDM.delete(tableNames.piece, pieceId), function(error, result) {
                        connection.query(sqlQueries.alterForeignKeyCheck(true), function(error, result) {
                        connection.release();
               if(error) {
                    console.log(errorMessages.log.getDatabaseQueryFailed("/pieces/:id"));
                    response.status(403).send(errorMessages.restRequests.getDatabaseQueryFailed(tableNames.piece));
               }
               else {
                   response.status(200).send(pieceId);
               }
                });
           });
       });
    }
    else {
        console.log(errorMessages.log.getDatabaseQueryFailed("/pieces/:id"));
        response.status(403).send(errorMessages.restRequests.getDatabaseQueryFailed(tableNames.piece));
       }
    });
});


app.listen(8081);

console.log("Server started successfully on port " + 8081);