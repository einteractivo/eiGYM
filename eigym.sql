-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 11-05-2026 a las 22:58:32
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `eigym`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `attendance`
--

CREATE TABLE `attendance` (
  `id` int(11) NOT NULL,
  `memberId` int(11) NOT NULL,
  `date` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `method` varchar(191) NOT NULL,
  `accessAllowed` tinyint(1) NOT NULL DEFAULT 1,
  `scheduleId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `attendance`
--

INSERT INTO `attendance` (`id`, `memberId`, `date`, `method`, `accessAllowed`, `scheduleId`) VALUES
(1, 5, '2026-05-08 22:02:55.381', 'MANUAL', 1, NULL),
(2, 4, '2026-05-08 22:03:09.371', 'MANUAL', 1, NULL),
(3, 7, '2026-05-09 21:14:06.127', 'MANUAL', 1, 6);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cashsession`
--

CREATE TABLE `cashsession` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `gymId` int(11) NOT NULL,
  `openedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `closedAt` datetime(3) DEFAULT NULL,
  `initialAmount` decimal(10,2) NOT NULL,
  `finalAmount` decimal(10,2) DEFAULT NULL,
  `expectedAmount` decimal(10,2) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'OPEN',
  `notes` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `cashsession`
--

INSERT INTO `cashsession` (`id`, `userId`, `gymId`, `openedAt`, `closedAt`, `initialAmount`, `finalAmount`, `expectedAmount`, `status`, `notes`) VALUES
(1, 1, 1, '2026-05-08 16:25:37.723', '2026-05-10 18:51:21.480', 0.00, 1201.30, 1201.36, 'CLOSED', ''),
(2, 3, 1, '2026-05-10 18:51:29.405', NULL, 100.00, NULL, NULL, 'OPEN', '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cashtransaction`
--

CREATE TABLE `cashtransaction` (
  `id` int(11) NOT NULL,
  `sessionId` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `type` varchar(191) NOT NULL,
  `category` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'COMPLETED',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `method` varchar(191) DEFAULT 'CASH'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `cashtransaction`
--

INSERT INTO `cashtransaction` (`id`, `sessionId`, `amount`, `type`, `category`, `description`, `status`, `createdAt`, `method`) VALUES
(1, 1, 50.00, 'EXPENSE', 'IMPREVISTOS', 'fghfghf', 'COMPLETED', '2026-05-08 16:25:54.131', 'CASH'),
(2, 1, 20.00, 'INCOME', 'INGRESO EXTRAORDINARIO', '', 'COMPLETED', '2026-05-08 18:50:36.763', 'CASH'),
(3, 1, 100.00, 'EXPENSE', 'SUELDOS', '', 'COMPLETED', '2026-05-08 21:10:29.907', 'CASH'),
(4, 1, 200.00, 'EXPENSE', 'SERVICIOS', '', 'COMPLETED', '2026-05-08 21:10:39.261', 'CASH'),
(5, 1, 11.00, 'INCOME', 'INGRESO EXTRAORDINARIO', 'SDFSD', 'COMPLETED', '2026-05-08 21:11:08.787', 'CASH'),
(6, 1, 11.00, 'EXPENSE', 'COMPRAS', 'Stock inicial producto: agua cielo (11 uds)', 'COMPLETED', '2026-05-08 23:38:31.399', 'CASH'),
(7, 1, 24.00, 'EXPENSE', 'COMPRAS', 'Stock inicial producto: sporate (12 uds)', 'COMPLETED', '2026-05-10 15:48:50.255', 'CASH'),
(8, 1, 200.00, 'INCOME', 'OTROS', '', 'COMPLETED', '2026-05-10 18:40:50.022', 'CASH'),
(9, 1, 1000.00, 'INCOME', 'OTROS', 'sdfsdfs', 'COMPLETED', '2026-05-10 18:41:42.232', 'CASH');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `equipment`
--

CREATE TABLE `equipment` (
  `id` int(11) NOT NULL,
  `gymId` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'OPERATIONAL',
  `location` varchar(191) DEFAULT NULL,
  `purchaseDate` datetime(3) DEFAULT NULL,
  `lastMaintenance` datetime(3) DEFAULT NULL,
  `photoUrl` longtext DEFAULT NULL,
  `notes` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gym`
--

CREATE TABLE `gym` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `logoUrl` varchar(191) DEFAULT NULL,
  `address` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `subscriptionExpiresAt` datetime(3) DEFAULT NULL,
  `subscriptionPlan` varchar(191) NOT NULL DEFAULT 'TRIAL',
  `subscriptionAmount` decimal(10,2) DEFAULT NULL,
  `subscriptionDescription` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `gym`
--

INSERT INTO `gym` (`id`, `name`, `slug`, `logoUrl`, `address`, `phone`, `email`, `active`, `createdAt`, `updatedAt`, `subscriptionExpiresAt`, `subscriptionPlan`, `subscriptionAmount`, `subscriptionDescription`) VALUES
(1, 'Gimnasio Rock', 'default-gym', '/uploads/logo_1778427203556.png', 'calle tarata 234', '747889798', 'koko3d@gmail.com', 1, '2026-05-07 21:21:05.760', '2026-05-10 15:50:02.718', '2026-06-06 22:06:15.824', 'MONTHLY', 50.00, 'mensualidad'),
(3, 'gym roca', 'gym-roca', '/uploads/logo_1778345843377.png', 'calle tracn.com', '565656', 'jorge@einteractivo.net', 1, '2026-05-09 16:57:12.488', '2026-05-09 16:57:24.573', '2026-05-17 04:59:59.999', 'TRIAL', NULL, NULL),
(4, 'Test Gym', 'test-gym', NULL, 'Test Address', '123456789', 'testgym@einteractivo.net', 1, '2026-05-10 17:25:41.821', '2026-05-10 17:25:41.821', '2026-05-18 04:59:59.999', 'TRIAL', 0.00, '');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gymclass`
--

CREATE TABLE `gymclass` (
  `id` int(11) NOT NULL,
  `gymId` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `color` varchar(191) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `gymclass`
--

INSERT INTO `gymclass` (`id`, `gymId`, `name`, `description`, `color`, `active`, `createdAt`, `updatedAt`) VALUES
(1, 1, 'step', '', '#34D399', 1, '2026-05-07 22:16:31.962', '2026-05-07 22:21:40.185'),
(2, 1, 'yoga', '', '#7C3AED', 1, '2026-05-07 22:16:40.128', '2026-05-07 22:16:40.128'),
(5, 3, 'Step', '', '#34D399', 1, '2026-05-09 19:32:21.868', '2026-05-09 19:32:21.868'),
(6, 3, 'Crossfit', '', '#A78BFA', 1, '2026-05-09 21:09:18.301', '2026-05-09 21:09:23.072'),
(7, 3, 'xbox', '', '#F472B6', 1, '2026-05-09 21:09:32.695', '2026-05-09 21:09:32.695');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gymregistration`
--

CREATE TABLE `gymregistration` (
  `id` int(11) NOT NULL,
  `gymName` varchar(191) NOT NULL,
  `contactName` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `phone` varchar(191) NOT NULL,
  `address` varchar(191) DEFAULT NULL,
  `notes` longtext DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'PENDING',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `password` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `gymregistration`
--

INSERT INTO `gymregistration` (`id`, `gymName`, `contactName`, `email`, `phone`, `address`, `notes`, `status`, `createdAt`, `updatedAt`, `password`) VALUES
(1, 'los macetas', 'pepe lucho', 'pepex@gmail.com', '45465465', 'av. arequipa 1232', 'asfsdf', 'REJECTED', '2026-05-09 15:30:26.813', '2026-05-09 20:58:29.487', NULL),
(2, 'gym roca', 'jauna maria', 'jorge@einteractivo.net', '565656', 'calle tracn.com', '', 'APPROVED', '2026-05-09 11:46:46.000', '2026-05-09 16:57:12.521', '$2b$10$M.VDaNVDuSEFAj6cDSK9u.64nNo8RaeTZJcbSYj0InHGMVELpLTDK'),
(3, 'Test Gym', 'Test Admin', 'testgym@einteractivo.net', '123456789', 'Test Address', '', 'APPROVED', '2026-05-10 12:25:11.000', '2026-05-10 17:25:41.987', '$2b$10$.pGJxkZ0VyGz.rOqoqbQjOkln8kAJW5tZyPXon5YZDohOj3cKuQ9W');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `member`
--

CREATE TABLE `member` (
  `id` int(11) NOT NULL,
  `gymId` int(11) NOT NULL,
  `firstName` varchar(191) NOT NULL,
  `lastName` varchar(191) NOT NULL,
  `dni` varchar(191) NOT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `birthday` datetime(3) DEFAULT NULL,
  `address` varchar(191) DEFAULT NULL,
  `photoUrl` longtext DEFAULT NULL,
  `fingerprintId` varchar(191) DEFAULT NULL,
  `qrCode` varchar(191) DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  `registrationDate` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `notes` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `member`
--

INSERT INTO `member` (`id`, `gymId`, `firstName`, `lastName`, `dni`, `phone`, `email`, `birthday`, `address`, `photoUrl`, `fingerprintId`, `qrCode`, `status`, `registrationDate`, `notes`) VALUES
(4, 1, 'lucho ', 'pepe', '23422433', '952372009', 'koko3d@gmail.com', '2000-05-07 00:00:00.000', 'sdfsdfsdf', 'data:image/jpeg;base64,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', NULL, NULL, 'ACTIVE', '2026-05-07 22:17:55.538', 'asfdsfd'),
(5, 1, 'maria ', 'juarez', '15454545', '952372009', 'sd@com.com', '2026-05-08 00:00:00.000', 'sdfgsdgds 34', NULL, NULL, NULL, 'ACTIVE', '2026-05-08 21:18:17.885', 'klkldasda'),
(6, 1, 'prueba1', 'prueba', '11111111', '324234', 'ssdfsd@com.com', '2026-05-16 00:00:00.000', 'sdfgsdgds 34dd', NULL, NULL, NULL, 'ACTIVE', '2026-05-08 23:34:57.449', NULL),
(7, 3, 'victor', 'murrugarra', '00121212', '1455', 'victor@gmail.com', '2004-02-12 00:00:00.000', NULL, NULL, NULL, NULL, 'ACTIVE', '2026-05-09 20:36:26.658', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `membership`
--

CREATE TABLE `membership` (
  `id` int(11) NOT NULL,
  `memberId` int(11) NOT NULL,
  `planId` int(11) NOT NULL,
  `startDate` datetime(3) NOT NULL,
  `endDate` datetime(3) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'ACTIVE',
  `price` decimal(10,2) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `membership`
--

INSERT INTO `membership` (`id`, `memberId`, `planId`, `startDate`, `endDate`, `status`, `price`, `createdAt`, `updatedAt`) VALUES
(1, 4, 1, '2026-05-07 22:17:55.543', '2026-06-06 22:17:55.543', 'ACTIVE', 100.00, '2026-05-07 22:17:55.538', '2026-05-07 22:17:55.538'),
(2, 5, 1, '2026-05-08 21:18:17.889', '2026-06-07 21:18:17.889', 'ACTIVE', 100.00, '2026-05-08 21:18:17.885', '2026-05-08 21:18:17.885'),
(3, 6, 1, '2026-05-08 23:54:49.115', '2026-06-07 23:54:49.115', 'ACTIVE', 100.00, '2026-05-08 23:54:49.112', '2026-05-08 23:54:49.112'),
(4, 7, 2, '2026-05-09 20:36:26.670', '2026-06-08 20:36:26.670', 'ACTIVE', 233.00, '2026-05-09 20:36:26.658', '2026-05-09 20:36:26.658');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `payment`
--

CREATE TABLE `payment` (
  `id` int(11) NOT NULL,
  `gymId` int(11) NOT NULL,
  `memberId` int(11) DEFAULT NULL,
  `membershipId` int(11) DEFAULT NULL,
  `saleId` int(11) DEFAULT NULL,
  `specialClassRegistrationId` int(11) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` enum('CASH','CARD','TRANSFER','YAPE','PLIN') NOT NULL,
  `type` varchar(191) NOT NULL,
  `date` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `status` varchar(191) NOT NULL DEFAULT 'COMPLETED',
  `notes` varchar(191) DEFAULT NULL,
  `cashSessionId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `payment`
--

INSERT INTO `payment` (`id`, `gymId`, `memberId`, `membershipId`, `saleId`, `specialClassRegistrationId`, `amount`, `method`, `type`, `date`, `status`, `notes`, `cashSessionId`) VALUES
(1, 1, 4, 1, NULL, NULL, 100.00, 'YAPE', 'MEMBERSHIP', '2026-05-07 22:17:55.538', 'COMPLETED', 'Pago inicial membresía: plan basico', 1),
(2, 1, 5, 2, NULL, NULL, 100.00, 'YAPE', 'MEMBERSHIP', '2026-05-08 21:18:17.885', 'COMPLETED', 'Pago inicial membresía: plan basico', 1),
(3, 1, 6, NULL, NULL, 1, 22.00, 'CASH', 'SPECIAL_CLASS', '2026-05-08 23:36:22.139', 'COMPLETED', NULL, 1),
(4, 1, NULL, NULL, 1, NULL, 2.36, 'CARD', 'PRODUCT', '2026-05-08 23:47:59.119', 'COMPLETED', 'Venta de productos - Ticket #1', 1),
(5, 1, NULL, NULL, 2, NULL, 16.00, 'YAPE', 'PRODUCT', '2026-05-08 23:50:51.023', 'COMPLETED', 'Venta de productos - Ticket #2', 1),
(6, 1, NULL, NULL, 3, NULL, 4.00, 'YAPE', 'PRODUCT', '2026-05-08 23:51:52.143', 'COMPLETED', 'Venta de productos - Ticket #3', 1),
(7, 1, 6, 3, NULL, NULL, 100.00, 'YAPE', 'MEMBERSHIP', '2026-05-08 23:54:49.112', 'COMPLETED', 'Renovación/Asignación membresía: plan basico', 1),
(8, 3, 7, 4, NULL, NULL, 233.00, 'YAPE', 'MEMBERSHIP', '2026-05-09 20:36:26.658', 'COMPLETED', 'Pago inicial membresía: PLAN BASICO 1', NULL),
(9, 1, NULL, NULL, 4, NULL, 3.00, 'CARD', 'PRODUCT', '2026-05-10 16:52:59.333', 'COMPLETED', 'Venta de productos - Ticket #4', 1),
(10, 1, NULL, NULL, 5, NULL, 8.00, 'YAPE', 'PRODUCT', '2026-05-10 18:38:44.515', 'COMPLETED', 'Venta: agua cielo (x4) - Ticket #5', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `plan`
--

CREATE TABLE `plan` (
  `id` int(11) NOT NULL,
  `gymId` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `durationDays` int(11) NOT NULL DEFAULT 30,
  `price` decimal(10,2) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `plan`
--

INSERT INTO `plan` (`id`, `gymId`, `name`, `durationDays`, `price`, `description`, `active`) VALUES
(1, 1, 'plan basico', 30, 100.00, '', 1),
(2, 3, 'PLAN BASICO 1', 30, 233.00, '', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `product`
--

CREATE TABLE `product` (
  `id` int(11) NOT NULL,
  `gymId` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `costPrice` decimal(10,2) NOT NULL DEFAULT 0.00,
  `price` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `photoUrl` varchar(191) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `product`
--

INSERT INTO `product` (`id`, `gymId`, `name`, `description`, `costPrice`, `price`, `stock`, `photoUrl`, `active`, `createdAt`, `updatedAt`) VALUES
(1, 1, 'agua cielo', '', 1.00, 2.00, 7, '', 1, '2026-05-08 23:38:31.366', '2026-05-10 18:38:44.515'),
(2, 1, 'sporate', 'asdasd', 2.00, 3.00, 11, NULL, 1, '2026-05-10 15:48:50.240', '2026-05-10 16:52:59.333');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sale`
--

CREATE TABLE `sale` (
  `id` int(11) NOT NULL,
  `gymId` int(11) NOT NULL,
  `memberId` int(11) DEFAULT NULL,
  `total` decimal(10,2) NOT NULL,
  `date` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `sale`
--

INSERT INTO `sale` (`id`, `gymId`, `memberId`, `total`, `date`) VALUES
(1, 1, NULL, 2.36, '2026-05-08 23:47:59.119'),
(2, 1, NULL, 16.00, '2026-05-08 23:50:51.023'),
(3, 1, NULL, 4.00, '2026-05-08 23:51:52.143'),
(4, 1, NULL, 3.00, '2026-05-10 16:52:59.333'),
(5, 1, NULL, 8.00, '2026-05-10 18:38:44.515');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `saleitem`
--

CREATE TABLE `saleitem` (
  `id` int(11) NOT NULL,
  `saleId` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `priceAtSale` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `saleitem`
--

INSERT INTO `saleitem` (`id`, `saleId`, `productId`, `quantity`, `priceAtSale`) VALUES
(1, 1, 1, 1, 2.36),
(2, 2, 1, 8, 2.00),
(3, 3, 1, 2, 2.00),
(4, 4, 2, 1, 3.00),
(5, 5, 1, 4, 2.00);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `schedule`
--

CREATE TABLE `schedule` (
  `id` int(11) NOT NULL,
  `classId` int(11) NOT NULL,
  `trainerId` int(11) NOT NULL,
  `dayOfWeek` int(11) NOT NULL,
  `startTime` varchar(191) NOT NULL,
  `endTime` varchar(191) NOT NULL,
  `capacity` int(11) NOT NULL DEFAULT 20,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `schedule`
--

INSERT INTO `schedule` (`id`, `classId`, `trainerId`, `dayOfWeek`, `startTime`, `endTime`, `capacity`, `active`, `createdAt`, `updatedAt`) VALUES
(1, 1, 1, 1, '08:00', '09:00', 20, 1, '2026-05-07 22:21:07.252', '2026-05-07 22:21:07.252'),
(2, 1, 1, 3, '08:00', '09:00', 20, 1, '2026-05-07 22:21:14.377', '2026-05-07 22:21:14.377'),
(3, 1, 1, 5, '08:00', '09:00', 20, 1, '2026-05-07 22:21:23.018', '2026-05-07 22:21:23.018'),
(4, 2, 4, 5, '17:00', '20:00', 20, 1, '2026-05-08 22:01:41.087', '2026-05-08 22:20:49.768'),
(5, 5, 6, 1, '08:00', '09:00', 20, 1, '2026-05-09 21:09:46.604', '2026-05-09 21:09:46.604'),
(6, 5, 6, 6, '16:10', '17:00', 20, 1, '2026-05-09 21:13:02.354', '2026-05-09 21:13:02.354');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `setting`
--

CREATE TABLE `setting` (
  `id` int(11) NOT NULL,
  `gymId` int(11) DEFAULT NULL,
  `key` varchar(191) NOT NULL,
  `value` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `setting`
--

INSERT INTO `setting` (`id`, `gymId`, `key`, `value`) VALUES
(1, 1, 'gym_name', 'gym rock'),
(2, 1, 'gym_email', 'contacto@eigym.com'),
(3, 1, 'gym_phone', '+51 987 654 321'),
(4, 1, 'gym_address', 'Av. Siempre Viva 123'),
(5, 1, 'gym_logo_url', '/uploads/logo_1778278265236.png'),
(8, NULL, 'saas_logo_url', '/uploads/logo_1778435362463.png'),
(9, 3, 'GYM_NAME', 'gym roca'),
(10, 3, 'CURRENCY', 'S/'),
(11, 3, 'gym_logo_url', '/uploads/logo_1778346553837.webp'),
(12, NULL, 'saas_footer_logo_url', '/uploads/logo_1778431178017.png'),
(13, 4, 'GYM_NAME', 'Test Gym'),
(14, 4, 'CURRENCY', 'S/'),
(15, NULL, 'saas_footer_text', 'Made with ❤️ for fitness enthusiast');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `specialclass`
--

CREATE TABLE `specialclass` (
  `id` int(11) NOT NULL,
  `gymId` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `memberPrice` decimal(10,2) NOT NULL DEFAULT 0.00,
  `schedule` varchar(191) DEFAULT NULL,
  `dayOfWeek` int(11) DEFAULT NULL,
  `startTime` varchar(191) DEFAULT NULL,
  `endTime` varchar(191) DEFAULT NULL,
  `capacity` int(11) DEFAULT NULL,
  `color` varchar(191) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `specialclass`
--

INSERT INTO `specialclass` (`id`, `gymId`, `name`, `description`, `price`, `memberPrice`, `schedule`, `dayOfWeek`, `startTime`, `endTime`, `capacity`, `color`, `active`, `createdAt`, `updatedAt`) VALUES
(2, 1, 'clase demo11', 'asdas', 22.00, 0.00, NULL, 5, '06:30', '07:00', 33, '#F43F5E', 1, '2026-05-08 23:35:52.926', '2026-05-08 23:35:52.926'),
(3, 3, 'dia de la madre', 'asdasdas', 22.00, 0.00, NULL, 3, '08:00', '09:00', 12, '#4F46E5', 1, '2026-05-09 19:32:39.097', '2026-05-09 19:32:39.097');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `specialclassregistration`
--

CREATE TABLE `specialclassregistration` (
  `id` int(11) NOT NULL,
  `specialClassId` int(11) NOT NULL,
  `memberId` int(11) NOT NULL,
  `registrationDate` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `status` varchar(191) NOT NULL DEFAULT 'ACTIVE'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `specialclassregistration`
--

INSERT INTO `specialclassregistration` (`id`, `specialClassId`, `memberId`, `registrationDate`, `status`) VALUES
(1, 2, 6, '2026-05-08 23:36:22.139', 'ACTIVE');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `trainerattendance`
--

CREATE TABLE `trainerattendance` (
  `id` int(11) NOT NULL,
  `trainerId` int(11) NOT NULL,
  `gymId` int(11) NOT NULL,
  `scheduleId` int(11) DEFAULT NULL,
  `checkIn` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `checkOut` datetime(3) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'PRESENT',
  `notes` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `trainerattendance`
--

INSERT INTO `trainerattendance` (`id`, `trainerId`, `gymId`, `scheduleId`, `checkIn`, `checkOut`, `status`, `notes`) VALUES
(1, 6, 3, 6, '2026-05-09 21:39:39.280', NULL, 'LATE', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `role` enum('SUPERADMIN','ADMIN','TRAINER','RECEPTION') NOT NULL DEFAULT 'RECEPTION',
  `notes` longtext DEFAULT NULL,
  `gymId` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `user`
--

INSERT INTO `user` (`id`, `name`, `email`, `password`, `role`, `notes`, `gymId`, `createdAt`, `updatedAt`) VALUES
(1, 'Admin', 'admin@eigym.com', '$2b$10$o/oi9w60YbkOapTgwLVzwuvMK89mI5TpKrWNZoieSWo9b.B/kZhVa', 'SUPERADMIN', NULL, 1, '2026-05-07 21:21:05.867', '2026-05-08 20:56:39.114'),
(3, 'marcos ch', 'koko3d@gmail.com', '$2b$10$wlVKPKhQEG99feo1luEyO.Ngr/YWCUAnzebOg/6Halv/MQ6hVqj1S', 'ADMIN', NULL, 1, '2026-05-08 21:04:34.816', '2026-05-09 00:57:35.038'),
(4, 'marta perez', 'trainer@eigym.com', '$2b$10$jCjZy99uwOjIsWq81KO9d.aiiH7E1FAFYuRs6jf0fiZGtb3GjUWxe', 'TRAINER', 'horarios y disponibilidad', 1, '2026-05-08 22:17:32.425', '2026-05-08 22:18:09.365'),
(5, 'jauna maria', 'jorge@einteractivo.net', '$2b$10$M.VDaNVDuSEFAj6cDSK9u.64nNo8RaeTZJcbSYj0InHGMVELpLTDK', 'ADMIN', NULL, 3, '2026-05-09 16:57:12.511', '2026-05-09 16:57:12.511'),
(6, 'carlos alvarez', 'carlosalvares@gmail.com', '$2b$10$VhAcsGtrJpnJGfmI5CFecOQ3JhVe3858ZnMIXFGUbX2xH04E6K9yS', 'TRAINER', 'asdasda', 3, '2026-05-09 19:34:55.315', '2026-05-09 19:34:55.315'),
(7, 'Test Admin', 'testgym@einteractivo.net', '$2b$10$.pGJxkZ0VyGz.rOqoqbQjOkln8kAJW5tZyPXon5YZDohOj3cKuQ9W', 'ADMIN', NULL, 4, '2026-05-10 17:25:41.879', '2026-05-10 17:25:41.879');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Attendance_scheduleId_fkey` (`scheduleId`),
  ADD KEY `Attendance_memberId_fkey` (`memberId`);

--
-- Indices de la tabla `cashsession`
--
ALTER TABLE `cashsession`
  ADD PRIMARY KEY (`id`),
  ADD KEY `CashSession_userId_idx` (`userId`),
  ADD KEY `CashSession_gymId_idx` (`gymId`);

--
-- Indices de la tabla `cashtransaction`
--
ALTER TABLE `cashtransaction`
  ADD PRIMARY KEY (`id`),
  ADD KEY `CashTransaction_sessionId_idx` (`sessionId`);

--
-- Indices de la tabla `equipment`
--
ALTER TABLE `equipment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Equipment_gymId_idx` (`gymId`);

--
-- Indices de la tabla `gym`
--
ALTER TABLE `gym`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Gym_slug_key` (`slug`);

--
-- Indices de la tabla `gymclass`
--
ALTER TABLE `gymclass`
  ADD PRIMARY KEY (`id`),
  ADD KEY `GymClass_gymId_idx` (`gymId`);

--
-- Indices de la tabla `gymregistration`
--
ALTER TABLE `gymregistration`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `member`
--
ALTER TABLE `member`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Member_gymId_dni_key` (`gymId`,`dni`),
  ADD UNIQUE KEY `Member_gymId_fingerprintId_key` (`gymId`,`fingerprintId`),
  ADD UNIQUE KEY `Member_gymId_qrCode_key` (`gymId`,`qrCode`),
  ADD KEY `Member_gymId_idx` (`gymId`);

--
-- Indices de la tabla `membership`
--
ALTER TABLE `membership`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Membership_memberId_fkey` (`memberId`),
  ADD KEY `Membership_planId_fkey` (`planId`);

--
-- Indices de la tabla `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Payment_gymId_idx` (`gymId`),
  ADD KEY `Payment_memberId_fkey` (`memberId`),
  ADD KEY `Payment_membershipId_fkey` (`membershipId`),
  ADD KEY `Payment_saleId_fkey` (`saleId`),
  ADD KEY `Payment_cashSessionId_fkey` (`cashSessionId`),
  ADD KEY `Payment_specialClassRegistrationId_fkey` (`specialClassRegistrationId`);

--
-- Indices de la tabla `plan`
--
ALTER TABLE `plan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Plan_gymId_idx` (`gymId`);

--
-- Indices de la tabla `product`
--
ALTER TABLE `product`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Product_gymId_idx` (`gymId`);

--
-- Indices de la tabla `sale`
--
ALTER TABLE `sale`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Sale_gymId_idx` (`gymId`),
  ADD KEY `Sale_memberId_fkey` (`memberId`);

--
-- Indices de la tabla `saleitem`
--
ALTER TABLE `saleitem`
  ADD PRIMARY KEY (`id`),
  ADD KEY `SaleItem_saleId_fkey` (`saleId`),
  ADD KEY `SaleItem_productId_fkey` (`productId`);

--
-- Indices de la tabla `schedule`
--
ALTER TABLE `schedule`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Schedule_classId_fkey` (`classId`),
  ADD KEY `Schedule_trainerId_fkey` (`trainerId`);

--
-- Indices de la tabla `setting`
--
ALTER TABLE `setting`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Setting_gymId_key_key` (`gymId`,`key`),
  ADD KEY `Setting_gymId_idx` (`gymId`);

--
-- Indices de la tabla `specialclass`
--
ALTER TABLE `specialclass`
  ADD PRIMARY KEY (`id`),
  ADD KEY `SpecialClass_gymId_idx` (`gymId`);

--
-- Indices de la tabla `specialclassregistration`
--
ALTER TABLE `specialclassregistration`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `SpecialClassRegistration_specialClassId_memberId_key` (`specialClassId`,`memberId`),
  ADD KEY `SpecialClassRegistration_memberId_fkey` (`memberId`);

--
-- Indices de la tabla `trainerattendance`
--
ALTER TABLE `trainerattendance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `TrainerAttendance_trainerId_idx` (`trainerId`),
  ADD KEY `TrainerAttendance_gymId_idx` (`gymId`),
  ADD KEY `TrainerAttendance_scheduleId_idx` (`scheduleId`);

--
-- Indices de la tabla `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `User_email_key` (`email`),
  ADD KEY `User_gymId_fkey` (`gymId`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `attendance`
--
ALTER TABLE `attendance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `cashsession`
--
ALTER TABLE `cashsession`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `cashtransaction`
--
ALTER TABLE `cashtransaction`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `equipment`
--
ALTER TABLE `equipment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `gym`
--
ALTER TABLE `gym`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `gymclass`
--
ALTER TABLE `gymclass`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `gymregistration`
--
ALTER TABLE `gymregistration`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `member`
--
ALTER TABLE `member`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `membership`
--
ALTER TABLE `membership`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `payment`
--
ALTER TABLE `payment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `plan`
--
ALTER TABLE `plan`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `product`
--
ALTER TABLE `product`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `sale`
--
ALTER TABLE `sale`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `saleitem`
--
ALTER TABLE `saleitem`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `schedule`
--
ALTER TABLE `schedule`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `setting`
--
ALTER TABLE `setting`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `specialclass`
--
ALTER TABLE `specialclass`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `specialclassregistration`
--
ALTER TABLE `specialclassregistration`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `trainerattendance`
--
ALTER TABLE `trainerattendance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `Attendance_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `member` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Attendance_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `schedule` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `cashsession`
--
ALTER TABLE `cashsession`
  ADD CONSTRAINT `CashSession_gymId_fkey` FOREIGN KEY (`gymId`) REFERENCES `gym` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `CashSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `cashtransaction`
--
ALTER TABLE `cashtransaction`
  ADD CONSTRAINT `CashTransaction_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `cashsession` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `equipment`
--
ALTER TABLE `equipment`
  ADD CONSTRAINT `Equipment_gymId_fkey` FOREIGN KEY (`gymId`) REFERENCES `gym` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `gymclass`
--
ALTER TABLE `gymclass`
  ADD CONSTRAINT `GymClass_gymId_fkey` FOREIGN KEY (`gymId`) REFERENCES `gym` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `member`
--
ALTER TABLE `member`
  ADD CONSTRAINT `Member_gymId_fkey` FOREIGN KEY (`gymId`) REFERENCES `gym` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `membership`
--
ALTER TABLE `membership`
  ADD CONSTRAINT `Membership_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `member` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Membership_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `plan` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `payment`
--
ALTER TABLE `payment`
  ADD CONSTRAINT `Payment_cashSessionId_fkey` FOREIGN KEY (`cashSessionId`) REFERENCES `cashsession` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Payment_gymId_fkey` FOREIGN KEY (`gymId`) REFERENCES `gym` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Payment_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `member` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Payment_membershipId_fkey` FOREIGN KEY (`membershipId`) REFERENCES `membership` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Payment_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `sale` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Payment_specialClassRegistrationId_fkey` FOREIGN KEY (`specialClassRegistrationId`) REFERENCES `specialclassregistration` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `plan`
--
ALTER TABLE `plan`
  ADD CONSTRAINT `Plan_gymId_fkey` FOREIGN KEY (`gymId`) REFERENCES `gym` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `product`
--
ALTER TABLE `product`
  ADD CONSTRAINT `Product_gymId_fkey` FOREIGN KEY (`gymId`) REFERENCES `gym` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `sale`
--
ALTER TABLE `sale`
  ADD CONSTRAINT `Sale_gymId_fkey` FOREIGN KEY (`gymId`) REFERENCES `gym` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Sale_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `member` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `saleitem`
--
ALTER TABLE `saleitem`
  ADD CONSTRAINT `SaleItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `SaleItem_saleId_fkey` FOREIGN KEY (`saleId`) REFERENCES `sale` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `schedule`
--
ALTER TABLE `schedule`
  ADD CONSTRAINT `Schedule_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `gymclass` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Schedule_trainerId_fkey` FOREIGN KEY (`trainerId`) REFERENCES `user` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `setting`
--
ALTER TABLE `setting`
  ADD CONSTRAINT `Setting_gymId_fkey` FOREIGN KEY (`gymId`) REFERENCES `gym` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `specialclass`
--
ALTER TABLE `specialclass`
  ADD CONSTRAINT `SpecialClass_gymId_fkey` FOREIGN KEY (`gymId`) REFERENCES `gym` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `specialclassregistration`
--
ALTER TABLE `specialclassregistration`
  ADD CONSTRAINT `SpecialClassRegistration_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `member` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `SpecialClassRegistration_specialClassId_fkey` FOREIGN KEY (`specialClassId`) REFERENCES `specialclass` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `trainerattendance`
--
ALTER TABLE `trainerattendance`
  ADD CONSTRAINT `TrainerAttendance_gymId_fkey` FOREIGN KEY (`gymId`) REFERENCES `gym` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `TrainerAttendance_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `schedule` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `TrainerAttendance_trainerId_fkey` FOREIGN KEY (`trainerId`) REFERENCES `user` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `user`
--
ALTER TABLE `user`
  ADD CONSTRAINT `User_gymId_fkey` FOREIGN KEY (`gymId`) REFERENCES `gym` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
