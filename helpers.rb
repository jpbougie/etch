module Etch
  module Helpers
    def login(user)
      session['user'] = user.id
    end
    
    def logout
      session['user'] = nil
    end
    
    def load_session
      if u = session['user']
        @user = User.find(u)
      end
    end
    
    def logged_in?
      !!@user
    end
  end
end