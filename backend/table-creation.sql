-- Composer
CREATE TABLE Composer
(Id INTEGER PRIMARY KEY AUTO_INCREMENT,
Name TEXT,
LifeDescription TEXT,
BirthDate DATE,
Popularity SMALLINT CHECK (Popularity BETWEEN 0 AND 10),
Period TEXT,
WikipediaLink VARCHAR(512)
);

-- Piece
CREATE TABLE Piece 
(Id INTEGER PRIMARY KEY AUTO_INCREMENT, 
ComposerId INTEGER, 
CreationYear INTEGER CHECK (CreationYear BETWEEN 1000 AND 2017), 
Description TEXT, 
WikipediaLink VARCHAR(512), 
Name TEXT, 
Favorite BOOLEAN,
FirstYoutubeLink VARCHAR(512), 
CONSTRAINT FK_Piece_Composer FOREIGN KEY (ComposerId) REFERENCES Composer (Id));

-- ComposerVisitHistory and PieceVisitHistory
CREATE TABLE ComposerVisitHistory
(Timestamp DATETIME PRIMARY KEY,
ComposerId INTEGER,
CONSTRAINT FK_ComposerVisitHistory_Composer FOREIGN KEY (ComposerId) REFERENCES Composer (Id));

-- CREATE TABLE PieceVisitHistory
CREATE TABLE PieceVisitHistory
(Timestamp DATETIME PRIMARY KEY,
PieceId INTEGER,
CONSTRAINT FK_PieceVisitHistory_Piece FOREIGN KEY (PieceId) REFERENCES Piece (Id));