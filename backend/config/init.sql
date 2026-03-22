-- Create and use the database
CREATE DATABASE IF NOT EXISTS borrow_sys;
USE borrow_sys;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  available_quantity INT NOT NULL DEFAULT 0,
  status ENUM('available', 'borrowed', 'unavailable') DEFAULT 'available',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Borrowing records table
CREATE TABLE IF NOT EXISTS borrow_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity_borrowed INT NOT NULL DEFAULT 1,
  borrow_date DATE NOT NULL,
  expected_return_date DATE,
  actual_return_date DATE,
  status ENUM('borrowed', 'returned', 'overdue') DEFAULT 'borrowed',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Sample items
INSERT IGNORE INTO items (name, category, quantity, available_quantity, status, description) VALUES
('MacBook Pro 14"', 'Laptop', 5, 5, 'available', 'Apple MacBook Pro with M2 chip'),
('Dell Monitor 27"', 'Monitor', 8, 8, 'available', 'Dell 4K UHD monitor'),
('Logitech MX Keys', 'Keyboard', 10, 10, 'available', 'Wireless mechanical keyboard'),
('Sony WH-1000XM5', 'Headphones', 6, 6, 'available', 'Noise cancelling headphones'),
('iPad Pro 12.9"', 'Tablet', 4, 4, 'available', 'Apple iPad Pro with M2'),
('Canon EOS R6', 'Camera', 3, 3, 'available', 'Full-frame mirrorless camera'),
('USB-C Hub 10-in-1', 'Accessories', 15, 15, 'available', 'Multi-port USB-C hub'),
('Portable Projector', 'Projector', 2, 2, 'available', 'Full HD portable projector');
