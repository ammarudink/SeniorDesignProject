let Constants = {
   project_base_url: function(){
      const protocol = window.location.protocol || "http:";
      const host = window.location.hostname || "localhost";

      if (host === "localhost" || host === "127.0.0.1") {
         return `${protocol}//${host}:4000/api/v1/`;
      }

      return `${protocol}//${host}:4000/api/v1/`;
   },
   CUSTOMER_ROLE: "Customer",
   ADMIN_ROLE: "Admin"
}
