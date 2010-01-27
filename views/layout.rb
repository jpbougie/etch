module Views
  class Layout < Mustache
    def logged_in
      !@user.nil?
    end
    
    def logged_out
      @user.nil?
    end
  end
end