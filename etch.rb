require 'sinatra/base'
require 'mongo_mapper'
require 'mustache/sinatra'

require 'helpers'

require 'models/user'
require 'models/image'
require 'models/etching'

gem 'yajl-ruby'
require 'yajl'
  
module Etch
  class App < Sinatra::Base
    register Mustache::Sinatra
    helpers Etch::Helpers
    
    dir = File.dirname(File.expand_path(__FILE__))

    set :views,     "#{dir}/templates"
    set :mustaches, "#{dir}/views"
    set :namespace, Object
    set :public,    "#{dir}/public"
    set :static,    true
    
    enable :sessions
    
    configure do
      MongoMapper.database = "dev"
      MongoMapper.connection = Mongo::Connection.new('localhost')
      
      Mustache.raise_on_context_miss = true
    end
    
    before do
      load_session
    end
    
    get '/' do
      mustache :index
    end
    
    
    get '/signup/?' do
      mustache :signup
    end
    
    post '/signup/?' do
      u = User.new(:login => params[:login],
                   :email => params[:email],
                   :password => params[:password])
      if u.save
        login(u)
        redirect('/images')
      else
        mustache :signup
      end
    end
    
    get '/login/?' do
      mustache :login
    end
    
    post '/login/?' do
      if u = User.authenticate(params[:login], params[:password])
        login(u)
        redirect(params[:next] || '/images')
      else
        @error = "No matching user/password combination could be found."
        mustache :login
      end
    end
    
    get '/images/?' do
      @images = @user.images.map {|img| {:url => img.url, :id => img.id }}
      
      mustache :images
    end
    
    post '/images/?' do
      (redirect('/login') and return) unless logged_in?
      
      FileUtils.mv(params[:uploaded_file][:tempfile].path, "#{dir}/public/system/#{params[:uploaded_file][:filename]}")
      
      img = Image.new(:user => @user,
                      :url => params[:uploaded_file][:filename]
                      )
                      
      if img.save
        redirect("/images/#{img.id}")
      else
        @images = @user.images.map {|img| {:url => img.url, :id => img.id } }
        mustache :images
      end
    end
    
    get '/images/:id/?' do
      @image = Image.find(params[:id])
      not_found unless @image
      
      mustache :view
    end
    
    get '/draw/:id/?' do
      @image = Image.find(params[:id])
      not_found unless @image
      
      mustache :draw
    end
    
    get '/etch/:image/:id/?' do
      @image = Image.find(params[:image])
      not_found unless @image
      
      @etching = @image.etchings.find(params[:id])
      not_found unless @etching
      
      if request.xhr?
        content_type 'application/json'
        @etching.elements.to_json
      end
    end
    
    post '/draw/:id/?' do
      @image = Image.find(params[:id])
      not_found unless @image
      
      etching = Etching.import(request.body.read)
      etching.user = @user
      etching.created_at = Time.now
      
      @image.etchings << etching
      if @image.save
        redirect("/etch/#{etching.id}") and return unless request.xhr? 
        "ok"
      else
        "bad"
      end
    end
  end
end