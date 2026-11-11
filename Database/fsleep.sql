-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: fsleep
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `sleep_sessions`
--

DROP TABLE IF EXISTS `sleep_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sleep_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sleep_start` datetime NOT NULL,
  `sleep_end` datetime NOT NULL,
  `sleep_duration` float DEFAULT NULL,
  `sleep_quality` varchar(50) DEFAULT NULL,
  `usuario_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_sleep_usuario` (`usuario_id`),
  CONSTRAINT `fk_sleep_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=115 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sleep_sessions`
--

LOCK TABLES `sleep_sessions` WRITE;
/*!40000 ALTER TABLE `sleep_sessions` DISABLE KEYS */;
INSERT INTO `sleep_sessions` VALUES (4,'2026-02-19 18:19:50','2026-02-19 18:29:41',10,'Excelente',NULL),(5,'2026-02-21 10:00:40','2026-02-21 10:03:05',2,'Excelente',NULL),(6,'2026-02-21 10:12:01','2026-02-21 10:15:20',3,'Excelente',NULL),(7,'2026-02-21 10:24:42','2026-02-21 10:48:06',23,'Excelente',NULL),(8,'2026-02-21 10:58:53','2026-02-21 11:01:07',2,'Excelente',NULL),(9,'2026-02-21 11:10:08','2026-02-21 11:14:41',5,'Excelente',NULL),(10,'2026-02-21 11:16:54','2026-02-21 11:20:34',4,'Excelente',NULL),(11,'2026-03-05 16:51:45','2026-03-05 16:54:20',3,'Excelente',NULL),(12,'2026-03-06 12:48:53','2026-03-06 12:50:26',2,'Excelente',NULL),(13,'2026-03-07 18:15:06','2026-03-07 18:15:20',0,'Excelente',NULL),(14,'2026-03-07 18:21:13','2026-03-07 18:22:56',2,'Excelente',NULL),(15,'2026-03-07 18:31:50','2026-03-07 18:31:57',0,'Excelente',NULL),(16,'2026-03-08 15:25:28','2026-03-08 15:25:39',0,'Excelente',NULL),(17,'2026-03-08 15:31:34','2026-03-08 15:31:43',0,'Excelente',NULL),(18,'2026-03-12 18:14:39','2026-03-12 18:15:13',1,'Excelente',NULL),(19,'2026-03-23 18:12:51','2026-03-23 18:13:01',0,'Excelente',NULL),(20,'2026-03-23 18:25:42','2026-03-23 18:25:44',0,'Excelente',NULL),(21,'2026-03-24 09:07:07','2026-03-24 09:07:09',0,'Excelente',NULL),(22,'2026-03-24 09:16:22','2026-03-24 09:16:24',0,'Excelente',NULL),(23,'2026-03-24 09:29:07','2026-03-24 09:29:09',0,'Excelente',NULL),(24,'2026-03-24 09:35:41','2026-03-24 09:35:42',0,'Excelente',NULL),(25,'2026-03-26 09:05:35','2026-03-26 09:05:37',0,'Excelente',NULL),(26,'2026-03-26 09:07:24','2026-03-26 09:07:25',0,'Excelente',NULL),(27,'2026-03-26 09:57:52','2026-03-26 09:59:58',2,'Excelente',NULL),(28,'2026-03-26 10:07:10','2026-03-26 10:07:19',0,'Excelente',NULL),(29,'2026-03-26 10:13:44','2026-03-26 10:16:22',3,'Excelente',NULL),(30,'2026-03-26 10:25:10','2026-03-26 10:25:12',0,'Excelente',NULL),(31,'2026-03-26 10:31:59','2026-03-26 10:32:02',0,'Excelente',NULL),(32,'2026-05-28 19:13:27','2026-05-29 03:13:27',480,'Excelente',3),(33,'2026-05-27 19:13:27','2026-05-28 02:13:27',420,'Buena',3),(34,'2026-05-26 19:13:27','2026-05-27 01:13:27',360,'Aceptable',3),(35,'2026-05-28 19:13:29','2026-05-29 03:13:29',480,'Excelente',3),(36,'2026-05-27 19:13:29','2026-05-28 02:13:29',420,'Buena',3),(37,'2026-05-26 19:13:29','2026-05-27 01:13:29',360,'Aceptable',3),(38,'2026-05-28 19:13:45','2026-05-29 03:13:45',480,'Excelente',3),(39,'2026-05-27 19:13:45','2026-05-28 02:13:45',420,'Buena',3),(40,'2026-05-26 19:13:45','2026-05-27 01:13:45',360,'Aceptable',3),(41,'2026-05-31 08:48:40','2026-05-31 08:49:18',368,'Regular',4),(42,'2026-05-31 15:28:46','2026-05-31 15:28:49',368,'Regular',4),(43,'2026-06-01 17:25:07','2026-06-01 17:26:03',368,'Aceptable',4),(44,'2026-06-06 08:23:09','2026-06-06 08:23:13',368,'Aceptable',4),(45,'2026-06-06 15:04:29','2026-06-06 15:04:35',368,'Aceptable',4),(46,'2026-06-06 17:37:28','2026-06-06 17:37:35',368,'Aceptable',4),(47,'2026-06-06 17:49:26','2026-06-06 17:49:29',368,'Aceptable',4),(48,'2026-06-07 08:44:20','2026-06-07 08:44:23',368,'Aceptable',4),(49,'2026-06-07 09:08:11','2026-06-07 09:08:14',368,'Aceptable',4),(50,'2026-06-07 09:41:12','2026-06-07 09:41:15',368,'Aceptable',4),(51,'2026-06-07 10:10:29','2026-06-07 10:10:31',368,'Aceptable',4),(52,'2026-06-07 10:23:54','2026-06-07 10:23:56',368,'Aceptable',4),(53,'2026-06-07 10:47:20','2026-06-07 10:47:21',368,'Aceptable',4),(54,'2026-06-07 13:50:16','2026-06-07 13:50:18',368,'Aceptable',4),(55,'2026-06-07 14:01:02','2026-06-07 14:01:04',368,'Aceptable',4),(56,'2026-06-07 14:05:15','2026-06-07 14:05:17',368,'Aceptable',4),(57,'2026-06-07 14:09:39','2026-06-07 14:09:40',368,'Aceptable',4),(58,'2026-06-07 15:03:54','2026-06-07 15:03:55',368,'Aceptable',4),(59,'2026-06-07 15:35:42','2026-06-07 15:35:44',368,'Aceptable',4),(60,'2026-06-07 15:55:15','2026-06-07 15:55:18',368,'Aceptable',4),(61,'2026-06-07 15:55:15','2026-06-07 15:55:18',368,'Aceptable',4),(62,'2026-06-07 15:55:49','2026-06-07 15:55:50',368,'Aceptable',4),(63,'2026-06-07 16:08:14','2026-06-07 16:08:15',368,'Aceptable',4),(64,'2026-06-07 17:09:37','2026-06-07 17:09:38',368,'Aceptable',4),(65,'2026-06-08 17:48:20','2026-06-08 17:48:22',368,'Aceptable',4),(66,'2026-06-08 17:51:44','2026-06-08 17:51:45',368,'Aceptable',4),(67,'2026-06-08 17:59:16','2026-06-08 17:59:17',368,'Aceptable',4),(68,'2026-06-08 18:00:41','2026-06-08 18:00:43',368,'Aceptable',4),(69,'2026-06-09 17:03:36','2026-06-09 17:03:38',368,'Aceptable',4),(70,'2026-06-09 17:27:58','2026-06-09 17:28:01',368,'Aceptable',4),(71,'2026-06-09 17:35:02','2026-06-09 17:35:06',368,'Aceptable',4),(72,'2026-06-09 17:45:16','2026-06-09 17:45:19',368,'Aceptable',4),(73,'2026-06-10 16:30:19','2026-06-10 16:30:20',368,'Aceptable',4),(74,'2026-06-10 16:31:12','2026-06-10 16:31:13',368,'Aceptable',4),(75,'2026-06-10 16:32:09','2026-06-10 16:32:12',368,'Aceptable',4),(76,'2026-06-10 16:38:20','2026-06-10 16:38:25',368,'Aceptable',4),(77,'2026-06-10 16:39:40','2026-06-10 16:39:43',368,'Aceptable',4),(78,'2026-06-10 16:39:40','2026-06-10 16:39:43',368,'Aceptable',4),(79,'2026-06-10 16:46:40','2026-06-10 16:46:41',368,'Aceptable',4),(80,'2026-06-10 16:50:33','2026-06-10 16:50:35',368,'Aceptable',4),(81,'2026-06-10 16:52:07','2026-06-10 16:52:08',368,'Aceptable',4),(82,'2026-06-10 16:55:16','2026-06-10 16:55:17',368,'Aceptable',4),(83,'2026-06-10 16:55:52','2026-06-10 16:55:53',368,'Aceptable',4),(84,'2026-06-10 16:55:52','2026-06-10 16:55:53',368,'Aceptable',4),(85,'2026-06-10 16:56:42','2026-06-10 16:56:43',368,'Aceptable',4),(86,'2026-06-10 16:58:29','2026-06-10 16:58:32',368,'Aceptable',4),(87,'2026-06-10 16:58:29','2026-06-10 16:58:32',368,'Aceptable',4),(88,'2026-06-10 16:59:10','2026-06-10 16:59:12',368,'Aceptable',4),(89,'2026-06-10 16:59:42','2026-06-10 16:59:44',368,'Aceptable',4),(90,'2026-06-10 17:11:07','2026-06-10 17:11:08',368,'Aceptable',4),(91,'2026-06-10 17:30:02','2026-06-10 17:30:03',368,'Aceptable',4),(92,'2026-06-10 17:37:56','2026-06-10 17:37:58',368,'Aceptable',4),(93,'2026-06-10 17:37:56','2026-06-10 17:37:58',368,'Aceptable',4),(94,'2026-06-10 17:38:08','2026-06-10 17:38:11',368,'Aceptable',4),(95,'2026-06-10 17:38:43','2026-06-10 17:38:47',368,'Aceptable',4),(96,'2026-06-10 17:42:22','2026-06-10 17:42:23',368,'Aceptable',4),(97,'2026-06-10 17:44:15','2026-06-10 17:44:16',368,'Aceptable',4),(98,'2026-06-10 17:47:28','2026-06-10 17:47:29',368,'Aceptable',4),(99,'2026-06-10 17:50:58','2026-06-10 17:50:59',368,'Aceptable',4),(100,'2026-06-10 17:53:15','2026-06-10 17:53:16',368,'Aceptable',4),(101,'2026-06-11 17:08:30','2026-06-11 17:08:31',368,'Aceptable',4),(102,'2026-06-11 17:16:33','2026-06-11 17:16:34',368,'Aceptable',4),(103,'2026-06-15 17:09:05','2026-06-15 17:09:06',368,'Aceptable',4),(104,'2026-08-19 18:08:38','2026-08-19 18:08:42',368,'Aceptable',4),(105,'2026-08-19 18:08:38','2026-08-19 18:08:42',368,'Aceptable',4),(106,'2026-10-12 14:52:59','2026-10-12 14:53:03',368,'Aceptable',4),(107,'2026-10-12 14:52:59','2026-10-12 14:53:03',368,'Aceptable',4),(108,'2026-10-12 14:52:59','2026-10-12 14:53:03',368,'Aceptable',4),(109,'2026-10-12 14:52:59','2026-10-12 14:53:03',368,'Aceptable',4),(110,'2026-11-02 18:46:36','2026-11-02 18:46:39',0,'No disponible',4),(111,'2026-11-02 18:46:36','2026-11-02 18:46:39',368,'Aceptable',4),(112,'2026-11-02 18:46:36','2026-11-02 18:49:02',368,'Aceptable',4),(113,'2026-11-05 19:15:34','2026-11-05 19:15:37',368,'Aceptable',4),(114,'2026-11-08 19:15:57','2026-11-08 19:15:58',368,'Aceptable',4);
/*!40000 ALTER TABLE `sleep_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Carlos','carlos@test.com','$2b$10$sT7PvWmu5yhcoEQQSt3LB.KyctA39LAKbZlxlvaf2/3uc9tk4pOMy','2026-04-06 09:18:45'),(2,'Carlos2','nuevo@test.com','$2b$10$geX5xEtRB2HT834z4oBJ8OMnMdDBTyfmG.MpWbJ9upGGr2MZ0i/GO','2026-04-14 15:51:44'),(3,'CarlosNuevo','carlosnuevo@test.com','$2b$10$Bsjqgf1SPbrNsl9Nix5qFuUZL0HpHaCt5x7wHT0.CCZnLPn4y8F0y','2026-04-14 16:01:13'),(4,'Carlos2','carlos2@test.com','$2b$10$Z1xIU3IUt5HtvGUsyOXtfO1OqaJ08gzMGaJKNagjchZAbEYVrKDk2','2026-04-22 15:50:36'),(5,'Carlos','carlos2001@test.com','$2b$10$qpHHcJ6e8.g1Rl2Ze/4vce3/Uj4Qwu8Xhq/BPo7XSZiVpPX1wGfVi','2026-07-22 17:11:49');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wearable_sleep_data`
--

DROP TABLE IF EXISTS `wearable_sleep_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wearable_sleep_data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date` date DEFAULT NULL,
  `deep_sleep` int DEFAULT NULL,
  `light_sleep` int DEFAULT NULL,
  `rem_sleep` int DEFAULT NULL,
  `awake_time` int DEFAULT NULL,
  `heart_rate_avg` int DEFAULT NULL,
  `usuario_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_date` (`usuario_id`,`date`),
  CONSTRAINT `fk_wearable_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wearable_sleep_data`
--

LOCK TABLES `wearable_sleep_data` WRITE;
/*!40000 ALTER TABLE `wearable_sleep_data` DISABLE KEYS */;
INSERT INTO `wearable_sleep_data` VALUES (14,'2026-04-21',7,289,72,56,0,3),(15,'2026-04-21',7,289,72,56,51,4),(16,'2026-05-29',120,240,90,20,58,3),(17,'2026-05-28',100,260,80,15,60,3),(18,'2026-05-27',140,220,95,18,57,3),(19,'2026-05-26',110,250,85,22,59,3),(20,'2026-05-25',130,230,90,17,56,3),(21,'2026-05-24',125,240,88,19,58,3),(22,'2026-05-23',135,225,92,16,55,3);
/*!40000 ALTER TABLE `wearable_sleep_data` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-11 19:43:57
