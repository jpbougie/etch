
  class Image
    include MongoMapper::Document
    
    key :url, String
    key :user_id, ObjectId
    
    belongs_to :user
    
    timestamps!
    
    many :etchings
  end