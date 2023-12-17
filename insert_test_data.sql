# Insert database rows here
INSERT INTO myForum.users
(Id, Username, PasswordHash, `First Name`, `Last Name`, Email)
VALUES(0x649AA91C6F8948F9A6EF2904DD6ADAB4, 'anotheruser', '1f40fc92da241694750979ee6cf582f2d5d7d28e18335de05abc54d0560e0f5302860c652bf08d560252aa5e74210546f369fbbbce8c12cfc7957b2652fe9a75', 'AnotherUser', 'Smith', 'AUSmith@test.org');
INSERT INTO myForum.users
(Id, Username, PasswordHash, `First Name`, `Last Name`, Email)
VALUES(0x6726E2926C0B415EA1540AA3697DAD22, 'test', '25ff47de4984a0a4911b047f4543264e3cb3ca7d5a6a41b13689f6d16b0ae7f70bb6d0d9e9a0b1e21f00ef11a2963056f4952d80f72fe1cda863b176aaac0c6b', 'Tester', 'McTesting', 'testermctesting@gmail.com');
INSERT INTO myForum.users
(Id, Username, PasswordHash, `First Name`, `Last Name`, Email)
VALUES(0xDC507624EE9A4CA8A33AFA185C950BDE, 'tatter', 'ee26b0dd4af7e749aa1a8ee3c10ae9923f618980772e473f8819a5d4940e0db27ac185f8a0e1d5f84f88bc887fd67b143732c304cc5fa9ad8e6f57f50028a8ff', 'TatterTat', 'Tetted', 'tattertattetted@outlook.co.uk');

INSERT INTO myForum.topics
(id, name, description)
VALUES(0x4368BAE65B8A999499DA0E97D1B28687, 'Test', 'A test topic');
INSERT INTO myForum.topics
(id, name, description)
VALUES(0x4BEF14FF98B64DF692E5549257424954, 'Potato', 'Lovely Potatoes');

INSERT INTO myForum.user_topics
(user_id, topic_id)
VALUES(0x649AA91C6F8948F9A6EF2904DD6ADAB4, 0x4368BAE65B8A999499DA0E97D1B28687);
INSERT INTO myForum.user_topics
(user_id, topic_id)
VALUES(0x649AA91C6F8948F9A6EF2904DD6ADAB4, 0x4BEF14FF98B64DF692E5549257424954);

INSERT INTO myForum.posts
(id, topic_id, user_id, title, body)
VALUES(0x41AD04CE63128D9AAFFBB573EB763514, 0x4368BAE65B8A999499DA0E97D1B28687, 0xDC507624EE9A4CA8A33AFA185C950BDE, 'Test Post', 'ajkfhsdafhjasdkjfhasdlkfjasdlkfjkdsalkfjadskljfalsdk aaaaaaaaa eeeeeeeeeeeeeeeeee');
INSERT INTO myForum.posts
(id, topic_id, user_id, title, body)
VALUES(0x41EF9ABE4D7E0CF896678FDDC2B1D8EF, 0x4BEF14FF98B64DF692E5549257424954, 0x6726E2926C0B415EA1540AA3697DAD22, 'yappa yappa', 'RaNdOm WorDs');
INSERT INTO myForum.posts
(id, topic_id, user_id, title, body)
VALUES(0x4316B63EAD573A29B7B2D4BA6119FF19, 0x4368BAE65B8A999499DA0E97D1B28687, 0x649AA91C6F8948F9A6EF2904DD6ADAB4, 'alalalalalalalala', 'aaaaa');
INSERT INTO myForum.posts
(id, topic_id, user_id, title, body)
VALUES(0x479400544E21D063A333D1ADB8F70A34, 0x4BEF14FF98B64DF692E5549257424954, 0x6726E2926C0B415EA1540AA3697DAD22, 'Another', 'HAHA!! THIS IS A POST BODY!');
INSERT INTO myForum.posts
(id, topic_id, user_id, title, body)
VALUES(0x4B8D69553ECFF93DBB683F93733A970F, 0x4368BAE65B8A999499DA0E97D1B28687, 0x649AA91C6F8948F9A6EF2904DD6ADAB4, 'aaaaaaaaaaaaaaaaaaaaaaa', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');