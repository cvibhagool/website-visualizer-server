#For the scraper
from scrapy import Item, Field
from scrapy.selector import Selector
from scrapy.crawler import CrawlerProcess
from scrapy.spiders import CrawlSpider, Rule
from scrapy.linkextractors import LinkExtractor
from urlparse import urlparse

#For writing to file
import json
import sys

def cleanUrl(url):
  url = url.strip()
  url = url.replace('www.','')
  if url[-1:] == '/':
    url = url[:-1]
  return url

#Raw items data to be cleaned. Maybe implement this in the middleware later
rawItemsData = []
domainArg = cleanUrl(sys.argv[1])

class SitemapperItem(Item):
    url = Field()
    referer = Field()
    depth = Field()

class SitemapperSpider(CrawlSpider):
    name = "Sitemapper"
    
    def __init__(self, domain = None):
      parsed_uri = urlparse(domain)
      parsed_domain = str(parsed_uri.netloc)
      parsed_domain = parsed_domain.replace('www.','')
      self.allowed_domains = [parsed_domain]
      self.start_urls = [
          domain
      ]
      self._rules = (Rule(LinkExtractor(), callback=self.parse_url, follow=True), )


    def parse_url(self, response):
        item = SitemapperItem()
        item['referer'] = response.request.headers.get('Referer', None)
        item['url'] = response.url
        item['depth'] = response.meta['depth']
        rawItemsData.append(item)
        return item

process = CrawlerProcess({
    #Limit depth to be 100
    'DEPTH_LIMIT' : 4,
    #Limit number of items to be 100
    'CLOSESPIDER_ITEMCOUNT': 100,
    #Hide the errors
    'DOWNLOAD_HANDLERS' : {'s3': None},
    #Hide logging
    'LOG_ENABLED' : False
})
process.crawl(SitemapperSpider,domain = domainArg)
process.start() # the script will block here until the crawling is finished

#Cleaning items data
#
#Construct list of nodes and its depth
nodes = [];
links = [];
for link in rawItemsData:
  url = cleanUrl(link['url'])
  referer = cleanUrl(link['referer'])
  depth = link['depth']
  if url == domainArg:
    depth = 0
  nodes.append({'url': url , 'depth': depth})
  links.append({'url': url, 'referer': referer})

output = {'nodes' : nodes, 'links' : links}

siteMap = {'url': domainArg, 'map': output}
with open('output.json', 'w') as f:
  json.dump(siteMap, f)

