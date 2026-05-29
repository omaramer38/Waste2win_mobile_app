CREATE DATABASE IF NOT EXISTS recypoints_mobile
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE recypoints_mobile;

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS account_statuses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(40) NULL,
  role_id INT NOT NULL,
  status_id INT NOT NULL DEFAULT 1,
  city_id INT NULL,
  points INT NOT NULL DEFAULT 0,
  salary DECIMAL(10,2) NOT NULL DEFAULT 0,
  rank_score DECIMAL(3,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id),
  CONSTRAINT fk_users_status FOREIGN KEY (status_id) REFERENCES account_statuses(id),
  CONSTRAINT fk_users_city FOREIGN KEY (city_id) REFERENCES cities(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS waste_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  points_per_unit INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recycle_order_statuses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recycle_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  city_id INT NOT NULL,
  phone VARCHAR(40) NOT NULL,
  address TEXT NOT NULL,
  status_id INT NOT NULL DEFAULT 1,
  worker_id INT NULL,
  rejection_comment TEXT NULL,
  total_points INT NOT NULL DEFAULT 0,
  is_store_order BOOLEAN NOT NULL DEFAULT FALSE,
  store_product_title VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_recycle_customer FOREIGN KEY (customer_id) REFERENCES users(id),
  CONSTRAINT fk_recycle_city FOREIGN KEY (city_id) REFERENCES cities(id),
  CONSTRAINT fk_recycle_status FOREIGN KEY (status_id) REFERENCES recycle_order_statuses(id),
  CONSTRAINT fk_recycle_worker FOREIGN KEY (worker_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recycle_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  waste_type_id INT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  points INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_recycle_item_order FOREIGN KEY (order_id) REFERENCES recycle_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_recycle_item_waste FOREIGN KEY (waste_type_id) REFERENCES waste_types(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recycle_order_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  image_uri TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_recycle_image_order FOREIGN KEY (order_id) REFERENCES recycle_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_statuses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  description TEXT NULL,
  category_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  points INT NOT NULL DEFAULT 0,
  status_id INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES product_categories(id),
  CONSTRAINT fk_products_status FOREIGN KEY (status_id) REFERENCES product_statuses(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  image_uri TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS store_order_statuses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS store_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  status_id INT NOT NULL DEFAULT 1,
  recycle_order_id INT NULL,
  total_points INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_store_customer FOREIGN KEY (customer_id) REFERENCES users(id),
  CONSTRAINT fk_store_status FOREIGN KEY (status_id) REFERENCES store_order_statuses(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS store_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  store_order_id INT NOT NULL,
  product_id INT NOT NULL,
  product_title VARCHAR(180) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  points_each INT NOT NULL DEFAULT 0,
  image_uri TEXT NULL,
  CONSTRAINT fk_store_item_order FOREIGN KEY (store_order_id) REFERENCES store_orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_store_item_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS app_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(120) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ai_model_endpoints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  purpose VARCHAR(180) NOT NULL,
  endpoint_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

INSERT IGNORE INTO roles (id, name) VALUES
  (1, 'admin'),
  (2, 'worker'),
  (3, 'user');

INSERT IGNORE INTO account_statuses (id, name) VALUES
  (1, 'active'),
  (2, 'blocked'),
  (3, 'leave'),
  (4, 'trial');

INSERT IGNORE INTO cities (id, name) VALUES
  (1, 'Damietta'),
  (2, 'Tanta'),
  (3, 'Mansoura'),
  (4, 'Cairo'),
  (5, 'Giza'),
  (6, 'Alexandria');

INSERT IGNORE INTO recycle_order_statuses (id, code, name) VALUES
  (1, 'pending', 'Pending review'),
  (2, 'accepted', 'Accepted'),
  (3, 'rejected', 'Rejected'),
  (4, 'received', 'Received');

INSERT IGNORE INTO product_statuses (id, code, name) VALUES
  (1, 'available', 'Available'),
  (2, 'out_of_stock', 'Out of stock');

INSERT IGNORE INTO store_order_statuses (id, code, name) VALUES
  (1, 'preparing', 'Preparing'),
  (2, 'delivered', 'Delivered'),
  (3, 'cancelled', 'Cancelled');

INSERT IGNORE INTO waste_types (id, name, points_per_unit) VALUES
  (1, 'Plastic', 50),
  (2, 'Paper', 60),
  (3, 'Metal', 150),
  (4, 'Glass', 80),
  (5, 'Batteries', 80),
  (6, 'Electronics', 200),
  (7, 'بلاستيك', 50),
  (8, 'ورق', 60),
  (9, 'معدن', 150),
  (10, 'بطاريات', 80),
  (11, 'الكتروني', 200);

INSERT IGNORE INTO product_categories (id, name) VALUES
  (1, 'Personal Care'),
  (2, 'Lifestyle'),
  (3, 'Garden'),
  (4, 'Electronics');

INSERT IGNORE INTO users
  (id, username, email, password_hash, phone, role_id, status_id, city_id, points, salary, rank_score)
VALUES
  (1, 'admin1', 'admin@gmail.com', '$2b$10$/HqlA2NxSaNZiAEHKbLPT.XslJisBaW9HgYKMR/kpPiFMKm2Vqiza', '01111111111', 1, 1, 1, 0, 4000, 5.0),
  (2, 'worker1', 'worker@gmail.com', '$2b$10$/HqlA2NxSaNZiAEHKbLPT.XslJisBaW9HgYKMR/kpPiFMKm2Vqiza', '01022222222', 2, 1, 3, 0, 3500, 4.8),
  (3, 'user1', 'user@gmail.com', '$2b$10$/HqlA2NxSaNZiAEHKbLPT.XslJisBaW9HgYKMR/kpPiFMKm2Vqiza', '01000000001', 3, 1, 3, 500, 0, 0);

UPDATE users
SET password_hash = '$2b$10$/HqlA2NxSaNZiAEHKbLPT.XslJisBaW9HgYKMR/kpPiFMKm2Vqiza'
WHERE email IN ('admin@gmail.com', 'worker@gmail.com', 'user@gmail.com');

INSERT IGNORE INTO products
  (id, title, description, category_id, quantity, points, status_id)
VALUES
  (1, 'Recycled Fabric Tote Bag', 'Reusable recycled fabric bag', 2, 20, 200, 1),
  (2, 'Beauty Glow Serum', 'Personal care reward', 1, 10, 550, 1),
  (3, 'Peace Lily', 'Indoor plant reward', 3, 20, 300, 1),
  (4, 'USB Drive', 'Electronics reward', 4, 15, 230, 1),
  (5, 'Reusable Coffee Cup', 'Daily reusable cup', 2, 10, 150, 1);

INSERT IGNORE INTO product_images (id, product_id, image_uri, is_primary) VALUES
  (1, 1, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=1200&auto=format&fit=crop', TRUE),
  (2, 2, 'https://images.unsplash.com/photo-1556228578-dd6f2d6c6543?q=80&w=1200&auto=format&fit=crop', TRUE),
  (3, 3, 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1200&auto=format&fit=crop', TRUE),
  (4, 4, 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop', TRUE),
  (5, 5, 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=1200&auto=format&fit=crop', TRUE);

INSERT IGNORE INTO app_settings (setting_key, setting_value) VALUES
  ('site_name', 'Waste2Win'),
  ('support_email', 'support@waste2win.com'),
  ('support_phone', '01000000000'),
  ('bonus_every_orders', '10'),
  ('bonus_points', '10');
