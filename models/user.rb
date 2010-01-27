  class User
    include MongoMapper::Document

    key :login, String, :required => true, :unique => true
    key :email, String, :required => true, :unique => true
    key :hashed_password, String, :required => true
    key :salt, String
    key :active, Boolean
    
    many :images

    timestamps!

    def password=(pass)
      self.salt ||= User.random_salt
      self.hashed_password = User.encrypt(pass, self.salt)
    end

    def self.encrypt(pass, salt)
      Digest::SHA1.hexdigest([pass,salt].join("-"))
    end

    def self.random_salt
      allowed_characters = ('a'..'z').to_a + ('A'..'Z').to_a + ('0'..'9').to_a + %w(= - /)
      (0..15).map {|x| allowed_characters[rand(allowed_characters.size)]}
    end

    def gravatar(size=nil)
      "http://www.gravatar.com/avatar/#{Digest::MD5.hexdigest(self.email)}" + (size ? "?s=#{size}" : "")
    end
    
    def self.authenticate(login, password)
      if u = User.find_by_login(login)
        return u if u.hashed_password == User.encrypt(password, u.salt)
      end
    end

  end