#!/usr/bin/env python3
"""
Minecraft Wiki Image Scraper
Scrapes item images from Minecraft Wiki and saves URLs to JSON
"""

import json
import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import requests
from urllib.parse import urljoin, urlparse

# Configuration
OUTPUT_FILE = 'minecraft_item_images.json'
BASE_URL = 'https://minecraft.wiki'
WAIT_TIMEOUT = 1.5
DELAY_BETWEEN_REQUESTS = 1  # seconds

# List of common image selectors to try (in order of preference)
IMAGE_SELECTORS = [
    # Your original path
    '#mw-content-text>div:first-child>div:first-child>div:nth-child(2)>div:first-child>span:first-child>a:first-child>img', #good default
    '#mw-content-text>div:first-child>div:nth-child(2)>div:nth-child(2)>div:first-child>span:first-child>a:first-child>img', #if there is a redirection box
    
    'img[alt*="{}"]',
]

# Minecraft items list (add more as needed)
try:
    with open('en_us_items.json', encoding='utf-8', mode='r') as f:
        lang: dict = json.loads(f.read())
        
        MINECRAFT_ITEMS: list[str] = list(lang.values())
except FileNotFoundError:
    print('Please run the lang_extractor.py script before running this script. See instructions inside file.')
    exit(1)

def setup_driver():
    """Setup Chrome driver with appropriate options"""
    chrome_options = Options()
    chrome_options.add_argument('--headless')  # Run in background
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    return driver

def cull_outdated_items(existing_data, current_items):
    """Remove items from existing data that are not in current items list"""
    items_to_remove = []
    
    for item in existing_data.keys():
        if item not in current_items:
            items_to_remove.append(item)
    
    if items_to_remove:
        print(f"\n🗑️  Culling {len(items_to_remove)} outdated items:")
        for item in items_to_remove:
            print(f"  - Removing: {item}")
            del existing_data[item]
        print(f"✅ Culling complete. Removed {len(items_to_remove)} items.")
    else:
        print("✅ No outdated items found to cull.")
    
    return existing_data

def load_existing_data():
    """Load existing JSON data to avoid re-scraping"""
    known_data = {}
    
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, 'r') as f:
                known_data.update(json.loads(f.read()))
        except (json.JSONDecodeError, FileNotFoundError):
            pass
    
    # Load overrides if they exist
    if os.path.exists('overrides.json'):
        try:
            with open('overrides.json', 'r') as f:
                known_data.update(json.loads(f.read()))
        except (json.JSONDecodeError, FileNotFoundError):
            pass
    
    return known_data

def save_data(data):
    """Save data to JSON file"""
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Data saved to {OUTPUT_FILE}")

def is_valid_image_url(url):
    """Check if the URL points to a valid image"""
    try:
        # Check if it's a thumbnail or actual image
        # Remove query string from URL
        url_parts = urlparse(url)
        url_no_query = url_parts._replace(query="").geturl()

        if '/thumb/' in url_no_query and not url_no_query.endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp')):
            # Extract original image URL from thumbnail
            parts = url_no_query.split('/thumb/')
            if len(parts) > 1:
                original_path = parts[1].split('/')[0]
                url_no_query = f"{BASE_URL}/w/images/{original_path}"

        url = url_no_query
        
        response = requests.head(url, timeout=5)
        content_type = response.headers.get('content-type', '')
        return response.status_code == 200 and content_type.startswith('image/')
    except:
        return False

def find_item_image(driver, item_name, selectors):
    """Try to find item image using multiple selectors"""
    wait = WebDriverWait(driver, WAIT_TIMEOUT)
    
    for i, selector in enumerate(selectors):
        try:
            # Format selector with item name if it contains {}
            formatted_selector = selector.format(item_name.replace('_', ' '))
            
            print(f"  Trying selector {i+1}/{len(selectors)}: {formatted_selector[:50]}...")
            
            # Wait for element to be present
            img_element = wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, formatted_selector))
            )
            
            # Get the src attribute
            img_src = img_element.get_attribute('src')
            
            if img_src and is_valid_image_url(img_src):
                print(f"  ✓ Found valid image: {img_src}")
                return img_src
            else:
                print(f"  ✗ Invalid image URL: {img_src}")
                
        except (TimeoutException, NoSuchElementException):
            print(f"  ✗ Selector failed")
            continue
        except Exception as e:
            print(f"  ✗ Error with selector: {str(e)}")
            continue
    
    return False

def scrape_item_image(driver, item_name):
    """Scrape image for a single item"""
    # Construct wiki URL
    wiki_url = f"{BASE_URL}/w/{item_name}"
    
    print(f"\nScraping: {item_name}")
    print(f"URL: {wiki_url}")
    
    try:
        driver.get(wiki_url)
        time.sleep(2)  # Let page load
        
        # Try to find image using selectors
        image_url = find_item_image(driver, item_name, IMAGE_SELECTORS)
        
        if image_url:
            print(f"✓ Success: {image_url}")
            return image_url
        else:
            print(f"✗ No valid image found for {item_name}")
            return False
            
    except Exception as e:
        print(f"✗ Error scraping {item_name}: {str(e)}")
        return False

def main():
    """Main scraping function"""
    print("🎮 Minecraft Wiki Image Scraper Starting...")
    print(f"Output file: {OUTPUT_FILE}")
    print(f"Items to scrape: {len(MINECRAFT_ITEMS)}")
    
    # Load existing data
    existing_data = load_existing_data()
    print(f"Already scraped: {len(existing_data)} items")
    
    # Cull outdated items that are no longer in the current items list
    existing_data = cull_outdated_items(existing_data, MINECRAFT_ITEMS)
    
    # Save after culling
    if existing_data:
        save_data(existing_data)
    
    # Setup driver
    driver = setup_driver()
    
    try:
        scraped_count = 0
        success_count = 0
        
        for item in MINECRAFT_ITEMS:
            # Skip if already scraped
            if item in existing_data:
                print(f"⏭️  Skipping {item} (already scraped)")
                continue
            
            # Scrape the item
            result = scrape_item_image(driver, item)
            existing_data[item] = result
            
            if result:
                success_count += 1
            
            scraped_count += 1
            
            # Save progress periodically
            if scraped_count % 5 == 0:
                save_data(existing_data)
                print(f"💾 Progress saved ({scraped_count} items processed)")
            
            # Delay between requests
            time.sleep(DELAY_BETWEEN_REQUESTS)
        
        # Final save
        save_data(existing_data)
        
        print("\n🎉 Scraping completed!")
        print(f"📊 Total items: {len(existing_data)}")
        print(f"✅ Successful: {sum(1 for v in existing_data.values() if v)}")
        print(f"❌ Failed: {sum(1 for v in existing_data.values() if not v)}")
        
    except KeyboardInterrupt:
        print("\n⏹️  Scraping interrupted by user. Exiting gracefully...")
        save_data(existing_data)
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        save_data(existing_data)
    finally:
        driver.quit()
        print("🔒 Driver closed")

if __name__ == "__main__":
    main()
    
    # copy contents of saved file to ../src/lib/items.ts
    
    print("\n📂 Copying results to ../src/lib/items.ts...")
    
    prefix = '''import type { ItemsToImageUrl } from "./item_helper";
export const ITEMS_TO_IMAGE_URLS: ItemsToImageUrl = '''
    
    with open(OUTPUT_FILE, 'r') as f:
        data = f.read()
        
        with open('../src/lib/items.ts', 'w') as out_f:
            out_f.write(prefix + data)
            out_f.write('\n')