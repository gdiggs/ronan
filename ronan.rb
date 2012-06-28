require 'bundler'
Bundler.require

require 'sinatra/redis'

KEY = "songs-#{Time.now.to_i}" # add a tiny bit of obscurity to the key so that multiple instances will not interfere
REDIS_DELIMITER = "|||"

configure :production do
  set :redis, ENV['REDISTOGO_URL']
end

get '/' do
  @first_song = get_next_song
  haml :index
end

post '/add_song' do
  puts params.inspect
  if url_is_valid?(params[:url])
    add_song params
    { :status => 'success', :message => 'Added song! Rock on!' }.to_json
  else
    { :status => 'error', :message => 'That URL is not valid. It has to be an mp3, dude.' }.to_json
  end
end

def redis_push(data)
  next_id = redis.incr "#{KEY}count"
  next_key = "#{KEY}_#{next_id}"
  redis.set next_key, data
  redis.expireat next_key, (Time.now.to_i + 86400) # expire in 24 hours
end

def add_song(data)
  redis_push join_data(data)
end

def get_next_song(last_song_id = "")
  keys = redis.keys("#{KEY}_*")
  # make sure the same song won't play again
  keys.delete("#{KEY}_#{last_song_id}")
  # get random id from song keys
  next_song_key = keys.sample
  
  # split data and add key
  song_data = split_data redis.get(next_song_key)
  song_data[:key] = next_song_key
  song_data
end

# Returns raw redis string as a hash
def split_data(data)
  array = data.to_s.split(REDIS_DELIMITER)
  { :title => array[0], :artist => array[1], :url => array[2] }
end

# prepares data for redis. Expects a hash and returns a string
def join_data(data)
  [data[:title], data[:artist], data[:url]].join(REDIS_DELIMITER)
end

# all urls should match URI standard and end in .mp3
def url_is_valid?(url)
  puts "#{url} #{url =~ URI.regexp}"
  url =~ URI.regexp && url =~ /\.mp3$/
end

